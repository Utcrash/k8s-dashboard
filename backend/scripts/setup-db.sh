#!/bin/bash

# Setup script for MongoDB
echo "🗄️ Setting up MongoDB for K8s Dashboard..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️ MongoDB is not running"
    
    # Check if MongoDB is installed
    if ! command -v mongod &> /dev/null; then
        echo "❌ MongoDB is not installed"
        echo "Please install MongoDB first:"
        echo "  macOS: brew install mongodb-community"
        echo "  Ubuntu: sudo apt-get install mongodb"
        echo "  CentOS: sudo yum install mongodb-org"
        exit 1
    fi
    
    echo "🚀 Starting MongoDB..."
    # Try to start MongoDB (this varies by system)
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start mongodb-community
    elif systemctl --version &> /dev/null; then
        # Systems with systemd
        sudo systemctl start mongod
    else
        # Fallback - try to start manually
        mongod --dbpath /data/db --fork --logpath /var/log/mongodb.log
    fi
    
    # Wait a moment for MongoDB to start
    sleep 3
fi

# Test connection
echo "🔍 Testing MongoDB connection..."
if mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
    echo "✅ MongoDB is running and accessible"
    echo "📋 Database: dnio-k8s-dashboard"
    echo "🔗 Connection: mongodb://localhost:27017"
else
    echo "❌ Cannot connect to MongoDB"
    echo "Please ensure MongoDB is running on localhost:27017"
    exit 1
fi

echo "🎉 Database setup complete!"
