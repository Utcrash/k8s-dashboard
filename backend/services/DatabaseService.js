const { MongoClient } = require('mongodb');

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  // Singleton pattern
  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect() {
    if (this.isConnected) {
      return this.db;
    }

    try {
      const connectionString = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/dnio-k8s-dashboard';

      // Mask credentials in logs for security
      const maskedConnectionString = connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log(`🔌 Connecting to MongoDB: ${maskedConnectionString}`);
      
      this.client = new MongoClient(connectionString, {
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });

      await this.client.connect();
      this.db = this.client.db(); // Use database from connection string
      this.isConnected = true;

      console.log(`✅ Connected to MongoDB: ${this.db.databaseName}`);
      
      // Create indexes for better performance
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async createIndexes() {
    try {
      // Create indexes for clusters collection
      // Since we're using name as ID, we only need one unique index on name/id
      await this.db.collection('clusters').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('clusters').createIndex({ name: 1 }, { unique: true });
      await this.db.collection('clusters').createIndex({ environment: 1 });
      
      // Create indexes for connections collection (for tracking active connections)
      await this.db.collection('connections').createIndex({ clusterId: 1 }, { unique: true });
      await this.db.collection('connections').createIndex({ connectedAt: 1 });
      
      console.log('📋 Database indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Index creation warning:', error.message);
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Cluster operations
  async saveCluster(clusterConfig) {
    const db = this.getDatabase();
    const collection = db.collection('clusters');
    
    const clusterData = {
      ...clusterConfig,
      createdAt: clusterConfig.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      await collection.replaceOne(
        { id: clusterConfig.id },
        clusterData,
        { upsert: true }
      );
      console.log(`💾 Saved cluster: ${clusterConfig.name} (${clusterConfig.id})`);
      return clusterData;
    } catch (error) {
      console.error('❌ Failed to save cluster:', error.message);
      throw error;
    }
  }

  async getCluster(clusterId) {
    const db = this.getDatabase();
    const collection = db.collection('clusters');
    
    try {
      const cluster = await collection.findOne({ id: clusterId });
      return cluster;
    } catch (error) {
      console.error('❌ Failed to get cluster:', error.message);
      throw error;
    }
  }

  async getAllClusters() {
    const db = this.getDatabase();
    const collection = db.collection('clusters');
    
    try {
      const clusters = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return clusters;
    } catch (error) {
      console.error('❌ Failed to get clusters:', error.message);
      throw error;
    }
  }

  async deleteCluster(clusterId) {
    const db = this.getDatabase();
    const collection = db.collection('clusters');
    
    try {
      const result = await collection.deleteOne({ id: clusterId });
      if (result.deletedCount > 0) {
        console.log(`🗑️ Deleted cluster: ${clusterId}`);
        // Also remove any connection records
        await this.removeConnectionRecord(clusterId);
      }
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Failed to delete cluster:', error.message);
      throw error;
    }
  }

  // Connection tracking operations
  async saveConnectionRecord(clusterId, connectionInfo) {
    const db = this.getDatabase();
    const collection = db.collection('connections');
    
    const connectionData = {
      clusterId,
      ...connectionInfo,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    try {
      await collection.replaceOne(
        { clusterId },
        connectionData,
        { upsert: true }
      );
      console.log(`🔗 Saved connection record for: ${clusterId}`);
    } catch (error) {
      console.error('❌ Failed to save connection record:', error.message);
    }
  }

  async getConnectionRecord(clusterId) {
    const db = this.getDatabase();
    const collection = db.collection('connections');
    
    try {
      return await collection.findOne({ clusterId });
    } catch (error) {
      console.error('❌ Failed to get connection record:', error.message);
      return null;
    }
  }

  async removeConnectionRecord(clusterId) {
    const db = this.getDatabase();
    const collection = db.collection('connections');
    
    try {
      await collection.deleteOne({ clusterId });
      console.log(`🗑️ Removed connection record for: ${clusterId}`);
    } catch (error) {
      console.error('❌ Failed to remove connection record:', error.message);
    }
  }

  async updateLastActivity(clusterId) {
    const db = this.getDatabase();
    const collection = db.collection('connections');
    
    try {
      await collection.updateOne(
        { clusterId },
        { $set: { lastActivity: new Date() } }
      );
    } catch (error) {
      console.error('❌ Failed to update last activity:', error.message);
    }
  }

  // Get clusters with connection status
  async getClustersWithConnectionStatus() {
    const clusters = await this.getAllClusters();
    const db = this.getDatabase();
    const connectionsCollection = db.collection('connections');
    
    const clustersWithStatus = await Promise.all(
      clusters.map(async (cluster) => {
        const connection = await connectionsCollection.findOne({ clusterId: cluster.id });
        return {
          id: cluster.id,
          name: cluster.name,
          region: cluster.region,
          environment: cluster.environment,
          createdAt: cluster.createdAt,
          lastAccessed: cluster.lastAccessed,
          isConnected: !!connection,
          connectionInfo: connection?.connectedAt || null,
        };
      })
    );

    return clustersWithStatus;
  }
}

module.exports = DatabaseService;
