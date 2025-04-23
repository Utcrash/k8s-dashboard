# Kubernetes Dashboard

A React-based web UI for monitoring and managing Kubernetes resources with features like:

- View pods, services, deployments, configmaps, and service accounts
- Filter logs with search functionality
- Real-time log viewing with pause/resume capability
- Scroll-to-bottom functionality for logs
- Namespace selection for viewing resources

## Docker Hub Repository

The dashboard image is available on Docker Hub:
[https://hub.docker.com/repository/docker/utcrash/k8s-dashboard/](https://hub.docker.com/repository/docker/utcrash/k8s-dashboard/)

## Prerequisites

- Docker installed on your server
- kubectl configured with access to your Kubernetes cluster
- Nginx or another web server for SSL termination (optional)

## Setup

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

## Development

- `npm start` - Starts the development server
- `npm test` - Runs tests
- `npm run build` - Builds for production

## Future Enhancements

- Add support for more Kubernetes resources
- Implement edit and delete functionality
- Add metrics visualization
- Support dark/light theme toggle

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following options:

```
# Default Kubernetes namespace to use
REACT_APP_K8S_NAMESPACE=appveen

# Kubernetes API proxy URL (optional, defaults to http://localhost:8001)
# REACT_APP_API_URL=http://localhost:8001

# Base path for the application (optional, defaults to /k8s)
# PUBLIC_URL=/k8s
```

You can adjust these values based on your Kubernetes setup.

### Step 1: Start kubectl proxy

The dashboard requires access to the Kubernetes API. Start kubectl proxy as a background service:

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
