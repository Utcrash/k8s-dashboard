const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy API requests to the Kubernetes API server
    app.use(
        '/k8s-api',
        createProxyMiddleware({
            target: process.env.REACT_APP_K8S_API_URL || 'http://localhost:8001',
            changeOrigin: true,
            pathRewrite: {
                '^/k8s-api': '', // Remove the /k8s-api prefix before forwarding to the K8s API
            },
            secure: false,
            logLevel: 'debug',
            timeout: 30000, // 30 second timeout
            proxyTimeout: 30000,
            onError: (err, req, res) => {
                console.error('Proxy Error:', err);
                res.writeHead(504);
                res.end('Kubernetes API proxy error - make sure kubectl proxy is running on port 8001');
            }
        })
    );
}; 