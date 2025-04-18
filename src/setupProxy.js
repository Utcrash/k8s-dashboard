const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy API requests to the Kubernetes API server
    app.use(
        ['/api', '/apis'],
        createProxyMiddleware({
            target: process.env.REACT_APP_K8S_API_URL || 'http://localhost:8001',
            changeOrigin: true,
            // pathRewrite: {
            //   '^/api': '/api', // No rewrite needed when using kube proxy
            // },
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