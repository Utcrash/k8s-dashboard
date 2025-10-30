#!/bin/bash

echo "🚀 Setting up K8s Dashboard with SSH Tunnel Support"
echo "=================================================="

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - please configure as needed"
else
    echo "✅ Backend .env file already exists"
fi

# Create frontend .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating frontend .env file..."
    cat > .env << EOF
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3001/api

# Default Kubernetes namespace
REACT_APP_K8S_NAMESPACE=default
EOF
    echo "✅ Created frontend .env file"
else
    echo "✅ Frontend .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev          # Start both frontend and backend"
echo "  npm run backend      # Start only backend"
echo "  npm start            # Start only frontend"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env if needed"
echo "2. Run 'npm run dev' to start both services"
echo "3. Add your first cluster via the UI"
