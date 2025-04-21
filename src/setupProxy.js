const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy API requests to the Kubernetes API server
    app.use(
        '/k8s-api',
        createProxyMiddleware({
            target: process.env.K8S_API_URL || 'http://localhost:8001',
            changeOrigin: true,
            pathRewrite: {
                '^/k8s-api': '', // Remove the /k8s-api prefix before forwarding to the K8s API
            },
            secure: false,
            logLevel: 'debug',
            timeout: 30000, // 30 second timeout
            proxyTimeout: 30000,
            // Don't attempt websocket upgrade for metrics API
            ws: false,
            onProxyReq: (proxyReq, req, res) => {
                // Log the requested URL for debugging
                console.log(`Proxying request to: ${req.method} ${proxyReq.path}`);
            },
            onError: (err, req, res) => {
                console.error('Proxy Error:', err);
                if (!res.headersSent) {
                    res.writeHead(503);
                    res.end(`Kubernetes API proxy error: ${err.message}`);
                }
            }
        })
    );
}; 