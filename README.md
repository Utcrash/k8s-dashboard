# Kubernetes Dashboard

A React-based web UI for monitoring and managing Kubernetes resources with features like:

- View pods, services, deployments, configmaps, and service accounts
- Filter logs with search functionality
- Real-time log viewing with pause/resume capability
- Scroll-to-bottom functionality for logs
- Namespace selection for viewing resources

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Access to a Kubernetes cluster

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

The dashboard connects to the Kubernetes API through the proxy running on `http://localhost:8001` by default. You can customize this by setting the `REACT_APP_K8S_API_URL` environment variable:

```bash
REACT_APP_K8S_API_URL=http://your-k8s-api-server npm start
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
