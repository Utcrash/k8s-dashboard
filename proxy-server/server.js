const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const yaml = require('js-yaml');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Store active kubeconfig configurations
let kubeConfigs = new Map();

// Default kubectl proxy configuration
const defaultConfig = {
    id: 'default-kubectl-proxy',
    name: 'Local kubectl proxy',
    target: 'http://localhost:8001',
    isDefault: true
};

kubeConfigs.set(defaultConfig.id, defaultConfig);

// Endpoint to add a new kubeconfig
app.post('/api/kubeconfig', (req, res) => {
    try {
        const { id, name, configContent } = req.body;

        if (!id || !name || !configContent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Parse the kubeconfig
        const config = yaml.load(configContent);

        if (!config || !config.clusters || !config.contexts || !config.users) {
            return res.status(400).json({ error: 'Invalid kubeconfig format' });
        }

        // Extract server URL from the current context
        const currentContext = config.contexts.find(ctx =>
            ctx.name === config['current-context']
        );

        if (!currentContext) {
            return res.status(400).json({ error: 'No current context found in kubeconfig' });
        }

        const cluster = config.clusters.find(c =>
            c.name === currentContext.context.cluster
        );

        if (!cluster) {
            return res.status(400).json({ error: 'Cluster not found for current context' });
        }

        // Store the configuration
        const kubeConfig = {
            id,
            name,
            target: cluster.cluster.server,
            config,
            isDefault: false
        };

        kubeConfigs.set(id, kubeConfig);

        res.json({ success: true, message: 'Kubeconfig added successfully' });
    } catch (error) {
        console.error('Error adding kubeconfig:', error);
        res.status(500).json({ error: 'Failed to add kubeconfig' });
    }
});

// Endpoint to remove a kubeconfig
app.delete('/api/kubeconfig/:id', (req, res) => {
    const { id } = req.params;

    if (kubeConfigs.has(id)) {
        const config = kubeConfigs.get(id);
        if (config.isDefault) {
            return res.status(400).json({ error: 'Cannot remove default configuration' });
        }

        kubeConfigs.delete(id);
        res.json({ success: true, message: 'Kubeconfig removed successfully' });
    } else {
        res.status(404).json({ error: 'Kubeconfig not found' });
    }
});

// Endpoint to list all kubeconfigs
app.get('/api/kubeconfig', (req, res) => {
    const configs = Array.from(kubeConfigs.values()).map(config => ({
        id: config.id,
        name: config.name,
        target: config.target,
        isDefault: config.isDefault
    }));

    res.json(configs);
});

// Dynamic proxy middleware for different kubeconfigs
app.use('/api/cluster/:configId/*', (req, res, next) => {
    const { configId } = req.params;
    const kubeConfig = kubeConfigs.get(configId);

    if (!kubeConfig) {
        return res.status(404).json({ error: 'Kubeconfig not found' });
    }

    // Create proxy options
    const proxyOptions = {
        target: kubeConfig.target,
        changeOrigin: true,
        pathRewrite: {
            [`^/api/cluster/${configId}`]: '', // Remove the prefix
        },
        secure: false, // Allow self-signed certificates
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req, res) => {
            // Add authentication headers if available
            if (kubeConfig.config && !kubeConfig.isDefault) {
                const currentContext = kubeConfig.config.contexts.find(ctx =>
                    ctx.name === kubeConfig.config['current-context']
                );

                if (currentContext) {
                    const user = kubeConfig.config.users.find(u =>
                        u.name === currentContext.context.user
                    );

                    if (user && user.user) {
                        if (user.user.token) {
                            proxyReq.setHeader('Authorization', `Bearer ${user.user.token}`);
                        } else if (user.user.username && user.user.password) {
                            const credentials = Buffer.from(`${user.user.username}:${user.user.password}`).toString('base64');
                            proxyReq.setHeader('Authorization', `Basic ${credentials}`);
                        }
                    }
                }
            }

            console.log(`Proxying request to: ${req.method} ${proxyReq.path}`);
        },
        onError: (err, req, res) => {
            console.error('Proxy Error:', err);
            if (!res.headersSent) {
                res.writeHead(503);
                res.end(`Kubernetes API proxy error: ${err.message}`);
            }
        }
    };

    // Create and use the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    proxy(req, res, next);
});

// Default proxy for kubectl proxy (backward compatibility)
app.use('/k8s-api', createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: {
        '^/k8s-api': '', // Remove the /k8s-api prefix
    },
    secure: false,
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request to kubectl proxy: ${req.method} ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('Kubectl Proxy Error:', err);
        if (!res.headersSent) {
            res.writeHead(503);
            res.end(`Kubernetes API proxy error: ${err.message}`);
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Kubernetes proxy server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Default kubectl proxy: http://localhost:${PORT}/k8s-api`);
    console.log(`Kubeconfig management: http://localhost:${PORT}/api/kubeconfig`);
}); 