# Kubernetes Dashboard with Multi-Cluster SSH Support

A React-based web UI for monitoring and managing Kubernetes resources across multiple private clusters with SSH tunnel support.

## ✨ Features

### Core Dashboard Features
- View pods, services, deployments, configmaps, secrets, and service accounts
- Real-time log viewing with search and filtering
- Namespace selection and management
- Resource scaling and basic operations
- Dark theme with modern UI

### 🆕 Multi-Cluster SSH Support
- **SSH Tunnel Management**: Connect to private K8s clusters via bastion hosts
- **Multi-Cluster Support**: Manage multiple clusters across regions and environments
- **Dynamic Cluster Switching**: Switch between clusters without restarting
- **Secure Credential Storage**: Encrypted PEM files and kubeconfig management
- **Connection Health Monitoring**: Real-time connection status and testing

## 🏗️ Architecture

```
Frontend (React) → Backend (Express) → SSH Tunnel → Bastion Host → Private K8s Cluster
```

The dashboard now supports two deployment modes:
1. **Direct Mode**: Traditional kubectl proxy (existing functionality)
2. **SSH Tunnel Mode**: Connect to private clusters via SSH (new functionality)

## 🚀 Quick Start

### Option 1: SSH Tunnel Mode (Recommended for Private Clusters)

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd k8s-dashboard
chmod +x setup.sh
./setup.sh
```

2. **Start Both Services**:
```bash
npm run dev
```

3. **Access Dashboard**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Add Your First Cluster**:
   - Click the cluster switcher in the header
   - Select "Add New Cluster"
   - Provide SSH details and kubeconfig
   - Test connection and save

### Option 2: Direct Mode (Local/Accessible Clusters)

1. **Start kubectl proxy**:
```bash
kubectl proxy --port=8001
```

2. **Start dashboard**:
```bash
npm start
```

3. **Access**: http://localhost:3000

## 📋 Prerequisites

### For SSH Tunnel Mode
- Node.js 16+
- SSH access to bastion hosts
- kubectl installed on bastion hosts
- Valid kubeconfig files
- PEM key files for SSH authentication

### For Direct Mode
- kubectl configured locally
- Direct access to Kubernetes API

## ⚙️ Configuration

### Environment Variables

**Frontend (.env)**:
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3001/api

# Default namespace
REACT_APP_K8S_NAMESPACE=default
```

**Backend (backend/.env)**:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SSH_TIMEOUT=30000
MAX_CONNECTIONS=10
```

### Cluster Configuration

When adding a cluster via the UI, provide:

- **Cluster Name**: Human-readable name
- **Region**: AWS region or location
- **Environment**: dev/staging/prod/test
- **SSH Host**: Bastion host IP/hostname
- **SSH Username**: SSH user (ubuntu, ec2-user, etc.)
- **SSH Port**: Usually 22
- **PEM File**: Upload your .pem key file
- **Kubeconfig**: Paste kubeconfig content

## 🔧 Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start only backend
npm run backend

# Start only frontend
npm start

# Build for production
npm run build
```

### Project Structure

```
k8s-dashboard/
├── src/                    # React frontend
│   ├── components/
│   │   ├── Clusters/      # Cluster management UI
│   │   └── Layout/        # Dashboard layout
│   ├── context/           # React contexts
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Express backend
│   ├── services/          # SSH tunnel management
│   ├── routes/            # API routes
│   └── README.md          # Backend documentation
└── setup.sh              # Setup script
```

## 🐳 Docker Deployment

### 1. Docker Build Command

Build both frontend and backend images with one command:

```bash
# Build both images
docker build -t k8s-dashboard-frontend:latest . && \
docker build -t k8s-dashboard-backend:latest ./backend
```

### 2. Nginx Configuration

Add these location blocks to your existing nginx configuration:

```nginx
# K8s Dashboard Frontend
location /k8s/ {
    proxy_pass http://localhost:9091/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# K8s Dashboard Backend API
location /k8s-api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

**Note:** The frontend container serves the React app from `/k8s` path, so requests to `/k8s/` are proxied to the container root where the app handles routing.

### 3. Docker Run Command

Start both frontend and backend with Docker Compose:

```bash
# Create docker-compose.yml and start everything
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: k8s-dashboard-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: dnio-k8s-dashboard

  backend:
    image: k8s-dashboard-backend:latest
    container_name: k8s-dashboard-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      PORT: 3001
      FRONTEND_URL: http://localhost:9091
      MONGODB_CONNECTION_STRING: mongodb://mongodb:27017/dnio-k8s-dashboard
      SSH_TIMEOUT: 30000
      MAX_CONNECTIONS: 10
      JWT_SECRET: change-this-secret-in-production

  frontend:
    image: k8s-dashboard-frontend:latest
    container_name: k8s-dashboard-frontend
    restart: unless-stopped
    ports:
      - "9091:80"
    depends_on:
      - backend
    environment:
      REACT_APP_BACKEND_URL: http://localhost:3001/api
      REACT_APP_K8S_NAMESPACE: default

volumes:
  mongodb_data:
EOF

# Start all services
docker-compose up -d
```

**Alternative single command (without compose file):**

```bash
# Start all containers in one command
docker network create k8s-dashboard-net 2>/dev/null || true && \
docker run -d --name k8s-dashboard-mongodb --network k8s-dashboard-net --restart unless-stopped -v k8s-dashboard-mongo-data:/data/db -e MONGO_INITDB_DATABASE=dnio-k8s-dashboard mongo:7 && \
docker run -d --name k8s-dashboard-backend --network k8s-dashboard-net --restart unless-stopped -p 3001:3001 -e NODE_ENV=production -e PORT=3001 -e FRONTEND_URL=http://localhost:9091 -e MONGODB_CONNECTION_STRING=mongodb://k8s-dashboard-mongodb:27017/dnio-k8s-dashboard -e SSH_TIMEOUT=30000 -e MAX_CONNECTIONS=10 -e JWT_SECRET=change-this-secret-in-production k8s-dashboard-backend:latest && \
docker run -d --name k8s-dashboard-frontend --network k8s-dashboard-net --restart unless-stopped -p 9091:80 -e REACT_APP_BACKEND_URL=http://localhost:3001/api -e REACT_APP_K8S_NAMESPACE=default k8s-dashboard-frontend:latest
```

## 🔒 Security Considerations

### SSH Tunnel Mode
- PEM files are Base64 encoded and stored securely
- SSH connections use key-based authentication only
- Connection timeouts prevent hanging sessions
- Input validation on all kubectl commands
- CORS protection between frontend/backend

### General Security
- Deploy behind proper authentication
- Use RBAC to limit cluster access
- Implement TLS/SSL for production
- Regular security updates

## 🚨 Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection manually
ssh -i your-key.pem ubuntu@bastion-host-ip

# Check if kubectl is available on bastion
ssh -i your-key.pem ubuntu@bastion-host-ip "kubectl version --client"
```

### Backend Issues
```bash
# Check backend logs
cd backend && npm run dev

# Test API endpoints
curl http://localhost:3001/health
```

### Frontend Issues
```bash
# Check if backend is accessible
curl http://localhost:3001/api/clusters

# Clear browser cache and localStorage
```

## 📚 API Documentation

### Cluster Management
- `GET /api/clusters` - List all clusters
- `POST /api/clusters` - Add new cluster
- `POST /api/clusters/:id/connect` - Connect to cluster
- `POST /api/clusters/:id/test` - Test connection

### Kubernetes Resources
- `GET /api/k8s/:clusterId/namespaces` - Get namespaces
- `GET /api/k8s/:clusterId/namespaces/:ns/pods` - Get pods
- `GET /api/k8s/:clusterId/namespaces/:ns/deployments` - Get deployments

See `backend/README.md` for complete API documentation.

## 🎯 Use Cases

### Multi-Region AWS EKS
- Connect to EKS clusters in different regions
- Use bastion hosts in each VPC
- Manage dev/staging/prod environments

### Private On-Premise Clusters
- Access clusters behind firewalls
- Use jump servers for connectivity
- Maintain security compliance

### Hybrid Cloud Deployments
- Mix of cloud and on-premise clusters
- Unified dashboard for all environments
- Consistent management experience

## 🔮 Future Enhancements

- [ ] AWS SSM Session Manager support
- [ ] Multi-user authentication
- [ ] Cluster resource metrics
- [ ] Automated cluster discovery
- [ ] Backup/restore configurations
- [ ] Advanced RBAC integration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- Create an issue for bugs or feature requests
- Check existing issues for solutions
- Refer to backend/README.md for backend-specific help