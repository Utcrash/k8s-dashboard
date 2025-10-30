# K8s Dashboard Backend

Backend API service for the Kubernetes Dashboard with SSH tunneling support and MongoDB persistence.

## Features

- 🔐 SSH tunnel connections to remote Kubernetes clusters
- 🗄️ MongoDB persistence for cluster configurations
- 🚀 RESTful API for cluster management
- 📊 Real-time connection status tracking
- 🔧 kubectl command execution through SSH

## Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- SSH access to target Kubernetes clusters

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Or use our setup script
npm run setup-db
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=dnio-k8s-dashboard

# Security
JWT_SECRET=your-jwt-secret-here

# SSH Configuration
SSH_TIMEOUT=30000
MAX_CONNECTIONS=10

# Logging
LOG_LEVEL=info
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## Database Schema

### Collections

#### `clusters`
Stores cluster configurations:
```javascript
{
  id: "cluster_1698765432_abc123def",
  name: "Production EKS",
  region: "us-west-2", 
  environment: "production",
  sshConfig: {
    host: "bastion.example.com",
    port: 22,
    username: "ec2-user",
    pemFile: "base64-encoded-pem-content"
  },
  kubeconfig: "base64-encoded-kubeconfig",
  createdAt: ISODate("2023-10-31T12:00:00Z"),
  updatedAt: ISODate("2023-10-31T12:00:00Z"),
  lastAccessed: ISODate("2023-10-31T12:30:00Z")
}
```

#### `connections`
Tracks active SSH connections:
```javascript
{
  clusterId: "cluster_1698765432_abc123def",
  connectedAt: ISODate("2023-10-31T12:30:00Z"),
  lastActivity: ISODate("2023-10-31T12:35:00Z"),
  status: "connected"
}
```

## API Endpoints

### Cluster Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clusters` | List all clusters |
| POST | `/api/clusters` | Add new cluster |
| GET | `/api/clusters/:id` | Get cluster details |
| DELETE | `/api/clusters/:id` | Remove cluster |
| POST | `/api/clusters/:id/connect` | Connect to cluster |
| POST | `/api/clusters/:id/disconnect` | Disconnect from cluster |
| POST | `/api/clusters/:id/test` | Test cluster connection |
| GET | `/api/clusters/status/all` | Get connection status |

### Kubernetes Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/k8s/:clusterId/namespaces` | List namespaces |
| GET | `/api/k8s/:clusterId/pods` | List pods |
| GET | `/api/k8s/:clusterId/deployments` | List deployments |
| GET | `/api/k8s/:clusterId/pods/:podName/logs` | Get pod logs |
| POST | `/api/k8s/:clusterId/execute` | Execute kubectl command |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Example Usage

### Add a Cluster

```bash
curl -X POST http://localhost:3001/api/clusters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production EKS",
    "region": "us-west-2",
    "environment": "production",
    "sshConfig": {
      "host": "bastion.example.com",
      "username": "ec2-user",
      "pemFile": "LS0tLS1CRUdJTi..."
    },
    "kubeconfig": "YXBpVmVyc2lvbjogdjE..."
  }'
```

### Connect to Cluster

```bash
curl -X POST http://localhost:3001/api/clusters/cluster_123/connect
```

### List Pods

```bash
curl http://localhost:3001/api/k8s/cluster_123/pods?namespace=default
```

## Security Considerations

- PEM files and kubeconfigs are stored base64-encoded in MongoDB
- SSH connections are pooled and automatically cleaned up
- CORS is configured to only allow requests from the frontend URL
- All sensitive data should be properly secured in production

## Troubleshooting

### MongoDB Connection Issues

1. Ensure MongoDB is running:
   ```bash
   mongosh --eval "db.adminCommand('ismaster')"
   ```

2. Check MongoDB logs:
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

### SSH Connection Issues

1. Verify SSH key format (should be base64-encoded)
2. Test SSH connection manually:
   ```bash
   ssh -i /path/to/key.pem user@host
   ```
3. Check firewall rules and security groups

### Server Issues

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure all required dependencies are installed

## Development

### Project Structure

```
backend/
├── services/
│   ├── DatabaseService.js    # MongoDB operations
│   └── ClusterManager.js     # SSH & kubectl management
├── routes/
│   ├── clusters.js          # Cluster API routes
│   └── k8s.js              # Kubernetes API routes
├── scripts/
│   └── setup-db.sh         # Database setup script
├── server.js               # Main server file
└── package.json
```

### Adding New Features

1. Create new service classes in `services/`
2. Add API routes in `routes/`
3. Update database schema if needed
4. Add tests and documentation

## License

MIT