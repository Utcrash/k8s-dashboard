# Kubernetes Dashboard

A React-based web UI for monitoring and managing Kubernetes resources with features like:

- **Multi-cluster support**: Connect to multiple Kubernetes clusters using kubeconfig files
- View pods, services, deployments, configmaps, and service accounts
- Filter logs with search functionality
- Real-time log viewing with pause/resume capability
- Scroll-to-bottom functionality for logs
- Namespace selection for viewing resources
- Cluster configuration management

## New Multi-Cluster Feature

The dashboard now supports connecting to multiple Kubernetes clusters without requiring kubectl proxy on each server. You can:

1. **Add kubeconfig files**: Paste your kubeconfig content directly in the UI
2. **Switch between clusters**: Use the cluster selector in the header
3. **Manage configurations**: Add, remove, and organize your cluster connections
4. **Fallback support**: If no configs are added, it works exactly as before with kubectl proxy

### How it works

- **Default mode**: Uses kubectl proxy on port 8001 (backward compatible)
- **Multi-cluster mode**: Parses kubeconfig files and connects directly to cluster APIs
- **Authentication**: Supports bearer tokens, basic auth, and client certificates
- **CORS handling**: Includes a proxy server for better browser compatibility

## Docker Hub Repository

The dashboard image is available on Docker Hub:
[https://hub.docker.com/repository/docker/utcrash/k8s-dashboard/](https://hub.docker.com/repository/docker/utcrash/k8s-dashboard/)

## Prerequisites

- Docker installed on your server
- kubectl configured with access to your Kubernetes cluster (for default mode)
- Nginx or another web server for SSL termination (optional)

## Setup

### Quick Start (Default Mode)

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd k8s-dashboard
npm install
```

2. Start a Kubernetes proxy to allow API access:

```bash
kubectl proxy --port=8001
```

This command creates a proxy to your Kubernetes API server on port 8001, allowing the dashboard to communicate with your cluster.

3. Start the development server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard in your browser.

### Multi-Cluster Setup

1. Follow steps 1 and 3 from Quick Start (skip kubectl proxy)

2. Navigate to "Cluster Config" in the sidebar

3. Click "Add Configuration" and paste your kubeconfig content

4. Switch between clusters using the cluster selector in the header

### Using the Proxy Server (Recommended for Production)

For better CORS handling and authentication support:

1. Install proxy server dependencies:

```bash
cd proxy-server
npm install
```

2. Start the proxy server:

```bash
npm start
```

3. The proxy server runs on port 3001 and handles:
   - CORS issues
   - Authentication with different cluster types
   - Multiple kubeconfig routing

## Configuration

The dashboard connects to the Kubernetes API through the proxy running on `http://localhost:8001` by default. You can customize this by setting the `K8S_API_URL` environment variable.

> **Important Note**: Since this is a Create React App project, custom environment variables are normally required to start with `REACT_APP_` to be accessible in the browser code. We've removed this prefix for cleaner configuration, but you'll need to ensure these variables are properly injected during the build process. If you're using the standard Create React App build process, you may need to change back to using the `REACT_APP_` prefix.

```bash
K8S_API_URL=http://your-k8s-api-server npm start
```

## Deploying to Production

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Deploying to a Kubernetes Cluster

1. Build a Docker image:

```bash
docker build -t your-registry/k8s-dashboard:latest .
```

2. Push the image to your container registry:

```bash
docker push your-registry/k8s-dashboard:latest
```

3. Deploy to your Kubernetes cluster:

```bash
kubectl apply -f kubernetes/deployment.yaml
```

## Security Considerations

- The dashboard should be deployed behind proper authentication and authorization
- Consider using RBAC to limit what resources the dashboard can access
- For production use, implement proper TLS/SSL
- Store kubeconfig files securely and avoid exposing sensitive credentials
- Use service accounts with limited permissions when possible

## Development

- `npm start` - Starts the development server
- `npm test` - Runs tests
- `npm run build` - Builds for production

## Multi-Cluster Features

### Cluster Configuration Management

- **Add clusters**: Paste kubeconfig YAML content
- **Remove clusters**: Delete configurations (except default)
- **Switch clusters**: Use the header dropdown
- **View details**: See server URLs and contexts

### Supported Authentication Methods

- **Bearer tokens**: Most common for service accounts
- **Basic authentication**: Username/password
- **Client certificates**: Requires proxy server setup
- **kubectl proxy**: Default fallback method

### Limitations

- Direct browser connections may face CORS restrictions
- Client certificate authentication requires backend proxy
- Some clusters may require additional network configuration

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following options:

```
# Default Kubernetes namespace to use
REACT_APP_K8S_NAMESPACE=default

# Kubernetes API proxy URL (optional, defaults to http://localhost:8001)
# REACT_APP_API_URL=http://localhost:8001

# Base path for the application (optional, defaults to /k8s)
# PUBLIC_URL=/k8s
```

You can adjust these values based on your Kubernetes setup.

### Step 1: Start kubectl proxy (Optional)

If you're not using kubeconfig files, the dashboard requires access to the Kubernetes API. Start kubectl proxy as a background service:

```bash
# Run with nohup (persists until server restart)
nohup kubectl proxy --port=8001 --address='0.0.0.0' --accept-hosts='.*' > /tmp/kubectl-proxy.log 2>&1 &

# To stop the proxy later:
pkill -f "kubectl proxy"
```

### Step 2: Run the Dashboard Container

#### Simple Deployment

```bash
# Run with defaults (uses port 80, connects to localhost:8001)
docker run -d --name k8s-dashboard utcrash/k8s-dashboard:latest
```

#### Custom Deployment

```bash
# Run with custom port and API URL
docker run -d --name k8s-dashboard -p 9091:80 \
  -e K8S_API_URL=http://custom-api-server:8001 \
  utcrash/k8s-dashboard:latest
```

### Step 3: Configure Nginx (Optional)

Add this to your nginx server block for SSL termination:

```nginx
location /k8s/ {
    proxy_pass http://localhost:9091/k8s/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /k8s-api/ {
    proxy_pass http://localhost:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Accessing the Dashboard

- With Nginx: https://your-domain.com/k8s/
- Direct access: http://your-server-ip:80/k8s/

## Troubleshooting

### Common Issues

1. **CORS errors**: Use the proxy server or ensure proper CORS configuration
2. **Authentication failures**: Verify kubeconfig credentials and permissions
3. **Network timeouts**: Check cluster connectivity and firewall rules
4. **Certificate errors**: Ensure proper TLS configuration for HTTPS clusters

### Getting Help

- Check browser console for error messages
- Verify kubeconfig file format and credentials
- Test cluster connectivity using kubectl
- Review proxy server logs for authentication issues
