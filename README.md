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

### Traditional Deployment (Direct Mode)

```bash
# Build and run
docker build -t k8s-dashboard .
docker run -d -p 80:80 k8s-dashboard
```

### Multi-Service Deployment (SSH Mode)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./backend/.env:/app/.env

  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:3001/api
    depends_on:
      - backend
```

```bash
docker-compose up -d
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