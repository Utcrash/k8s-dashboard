const { Client } = require('ssh2');
const DatabaseService = require('./DatabaseService');

class ClusterManager {
  constructor() {
    this.activeConnections = new Map();
    this.db = DatabaseService.getInstance();
  }

  // Singleton pattern
  static getInstance() {
    if (!ClusterManager.instance) {
      ClusterManager.instance = new ClusterManager();
    }
    return ClusterManager.instance;
  }

  /**
   * Add a new cluster configuration
   */
  async addCluster(clusterConfig) {
    const { id, name, sshConfig, kubeconfig } = clusterConfig;
    
    if (!id || !name || !sshConfig || !kubeconfig) {
      throw new Error('Missing required cluster configuration fields');
    }

    // Validate SSH config
    if (!sshConfig.host || !sshConfig.username || !sshConfig.pemFile) {
      throw new Error('Invalid SSH configuration');
    }

    // Ensure database connection
    await this.db.connect();

    // Store cluster config in MongoDB
    const clusterData = {
      ...clusterConfig,
      createdAt: new Date(),
      lastAccessed: null
    };

    await this.db.saveCluster(clusterData);

    console.log(`✅ Added cluster: ${name} (${id})`);
    return { success: true, clusterId: id };
  }

  /**
   * Get all cluster configurations
   */
  async getClusters() {
    await this.db.connect();
    return await this.db.getClustersWithConnectionStatus();
  }

  /**
   * Get specific cluster config
   */
  async getCluster(clusterId) {
    await this.db.connect();
    return await this.db.getCluster(clusterId);
  }

  /**
   * Update cluster configuration
   */
  async updateCluster(clusterId, clusterConfig) {
    // Ensure database connection
    await this.db.connect();
    
    // Get existing cluster to preserve timestamps
    const existingCluster = await this.db.getCluster(clusterId);
    if (!existingCluster) {
      throw new Error(`Cluster ${clusterId} not found`);
    }
    
    // Close any active connection before updating
    this.closeConnection(clusterId);
    
    // Update cluster config in MongoDB
    const updatedClusterData = {
      ...clusterConfig,
      createdAt: existingCluster.createdAt, // Preserve creation date
      updatedAt: new Date(),
      lastAccessed: existingCluster.lastAccessed
    };

    await this.db.saveCluster(updatedClusterData);

    console.log(`✏️ Updated cluster: ${clusterConfig.name} (${clusterId})`);
    return { success: true, clusterId: clusterConfig.id };
  }

  /**
   * Remove cluster configuration
   */
  async removeCluster(clusterId) {
    // Close any active connection
    this.closeConnection(clusterId);
    
    // Ensure database connection
    await this.db.connect();
    
    // Remove from MongoDB
    const deleted = await this.db.deleteCluster(clusterId);
    
    if (deleted) {
      console.log(`🗑️ Removed cluster: ${clusterId}`);
      return { success: true };
    } else {
      throw new Error(`Cluster ${clusterId} not found`);
    }
  }

  /**
   * Establish SSH connection to cluster
   */
  async connectToCluster(clusterId) {
    console.log(`🔍 Looking for cluster: ${clusterId}`);
    
    const cluster = await this.getCluster(clusterId);
    if (!cluster) {
      console.error(`❌ Cluster ${clusterId} not found`);
      throw new Error(`Cluster ${clusterId} not found`);
    }

    // Check if already connected
    if (this.activeConnections.has(clusterId)) {
      console.log(`♻️ Reusing existing connection for ${cluster.name}`);
      return this.activeConnections.get(clusterId);
    }

    console.log(`🔌 Connecting to cluster: ${cluster.name}`);

    return new Promise((resolve, reject) => {
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error('SSH connection timeout'));
      }, 30000);

      conn.on('ready', () => {
        clearTimeout(timeout);
        console.log(`✅ SSH connection established to ${cluster.name}`);
        
        // Upload kubeconfig to remote server
        this.setupKubeconfig(conn, cluster.kubeconfig)
          .then(async () => {
            // Store active connection
            this.activeConnections.set(clusterId, {
              connection: conn,
              cluster: cluster,
              connectedAt: new Date().toISOString()
            });

            // Update last accessed in database
            cluster.lastAccessed = new Date();
            await this.db.saveCluster(cluster);
            
            // Save connection record
            await this.db.saveConnectionRecord(clusterId, {
              connectedAt: new Date(),
              status: 'connected'
            });

            resolve({
              clusterId,
              status: 'connected',
              connectedAt: new Date().toISOString()
            });
          })
          .catch(reject);
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`❌ SSH connection failed for ${cluster.name}:`, err.message);
        reject(new Error(`SSH connection failed: ${err.message}`));
      });

      conn.on('end', () => {
        console.log(`🔌 SSH connection ended for ${cluster.name}`);
        this.activeConnections.delete(clusterId);
        // Remove connection record from database
        this.db.removeConnectionRecord(clusterId).catch(console.error);
      });

      // Connect using SSH config
      try {
        conn.connect({
          host: cluster.sshConfig.host,
          port: cluster.sshConfig.port || 22,
          username: cluster.sshConfig.username,
          privateKey: Buffer.from(cluster.sshConfig.pemFile, 'base64'),
          readyTimeout: 30000,
          keepaliveInterval: 30000
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error(`Failed to initiate SSH connection: ${error.message}`));
      }
    });
  }

  /**
   * Setup kubeconfig on remote server
   */
  async setupKubeconfig(connection, kubeconfigBase64) {
    return new Promise((resolve, reject) => {
      const kubeconfig = Buffer.from(kubeconfigBase64, 'base64').toString('utf8');
      
      // Validate kubeconfig YAML syntax before uploading
      try {
        // Basic YAML validation - check for common issues
        if (!kubeconfig.includes('apiVersion:')) {
          throw new Error('Invalid kubeconfig: missing apiVersion');
        }
        if (!kubeconfig.includes('clusters:')) {
          throw new Error('Invalid kubeconfig: missing clusters section');
        }
        if (!kubeconfig.includes('users:')) {
          throw new Error('Invalid kubeconfig: missing users section');
        }
        if (!kubeconfig.includes('contexts:')) {
          throw new Error('Invalid kubeconfig: missing contexts section');
        }
        
        // Check for common YAML syntax issues
        const lines = kubeconfig.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() && !line.startsWith('#')) {
            // Check for missing colons in key-value pairs
            if (line.includes(':') && line.trim().endsWith(':')) {
              // This is okay - it's a parent key
            } else if (line.includes(':')) {
              // This should be a key-value pair
              const colonIndex = line.indexOf(':');
              if (colonIndex === -1 || colonIndex === line.length - 1) {
                console.warn(`⚠️ Potential YAML issue at line ${i + 1}: ${line}`);
              }
            }
          }
        }
        
        console.log('✅ Kubeconfig basic validation passed');
      } catch (validationError) {
        reject(new Error(`Kubeconfig validation failed: ${validationError.message}`));
        return;
      }
      
      // Use base64 encoding to safely transfer the kubeconfig (avoid HERE document issues)
      const kubeconfigBase64Safe = Buffer.from(kubeconfig).toString('base64');
      
      // Create .kube directory and write config using base64 decoding
      const commands = [
        'mkdir -p ~/.kube',
        'cp ~/.kube/config ~/.kube/config.backup 2>/dev/null || true',
        `echo "${kubeconfigBase64Safe}" | base64 -d > ~/.kube/config`,
        'chmod 600 ~/.kube/config',
        'kubectl config view --minify >/dev/null 2>&1'
      ].join(' && ');

      connection.exec(commands, (err, stream) => {
        if (err) {
          reject(new Error(`Failed to setup kubeconfig: ${err.message}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Kubeconfig setup and validation completed');
            resolve();
          } else {
            console.error('❌ Kubeconfig setup failed. Error output:', errorOutput);
            console.error('❌ Standard output:', output);
            reject(new Error(`Kubeconfig setup failed (exit code ${code}): ${errorOutput}`));
          }
        });
      });
    });
  }

  /**
   * Execute kubectl command on cluster
   */
  async executeKubectl(clusterId, command) {
    const connectionInfo = this.activeConnections.get(clusterId);
    if (!connectionInfo) {
      throw new Error(`No active connection to cluster ${clusterId}`);
    }

    const { connection, cluster } = connectionInfo;
    
    console.log(`🔧 Executing kubectl command on ${cluster.name}: ${command}`);
    
    // Update last activity in database
    await this.db.updateLastActivity(clusterId).catch(console.error);

    return new Promise((resolve, reject) => {
      const fullCommand = `kubectl ${command}`;
      
      connection.exec(fullCommand, (err, stream) => {
        if (err) {
          reject(new Error(`Failed to execute command: ${err.message}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          if (code === 0) {
            try {
              // Try to parse as JSON first
              const jsonOutput = JSON.parse(output);
              resolve(jsonOutput);
            } catch (e) {
              // If not JSON, return raw output
              resolve({ raw: output.trim() });
            }
          } else {
            reject(new Error(`Command failed (exit code ${code}): ${errorOutput}`));
          }
        });
      });
    });
  }

  /**
   * Execute raw shell command on cluster
   */
  async executeShellCommand(clusterId, command) {
    const connectionInfo = this.activeConnections.get(clusterId);
    if (!connectionInfo) {
      throw new Error(`No active connection to cluster ${clusterId}`);
    }

    const { connection, cluster } = connectionInfo;
    
    console.log(`🔧 Executing shell command on ${cluster.name}: ${command}`);
    
    // Update last activity in database
    await this.db.updateLastActivity(clusterId).catch(console.error);

    return new Promise((resolve, reject) => {
      connection.exec(command, (err, stream) => {
        if (err) {
          reject(new Error(`Failed to execute command: ${err.message}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          resolve({ 
            exitCode: code,
            stdout: output.trim(),
            stderr: errorOutput.trim(),
            success: code === 0
          });
        });
      });
    });
  }

  /**
   * Test cluster connection without storing data
   */
  async testConnection(clusterConfig) {
    return new Promise((resolve) => {
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        resolve({ 
          success: false, 
          message: 'SSH connection timeout' 
        });
      }, 15000); // Shorter timeout for testing

      conn.on('ready', () => {
        clearTimeout(timeout);
        console.log(`✅ Test SSH connection successful to ${clusterConfig.name}`);
        
        // Test kubeconfig setup without persisting
        this.testKubeconfig(conn, clusterConfig.kubeconfig)
          .then(() => {
            conn.end();
            resolve({ 
              success: true, 
              message: 'Connection and kubeconfig test successful' 
            });
          })
          .catch((error) => {
            conn.end();
            resolve({ 
              success: false, 
              message: `Kubeconfig test failed: ${error.message}` 
            });
          });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`❌ Test SSH connection failed for ${clusterConfig.name}:`, err.message);
        resolve({ 
          success: false, 
          message: `SSH connection failed: ${err.message}` 
        });
      });

      // Connect using SSH config
      try {
        conn.connect({
          host: clusterConfig.sshConfig.host,
          port: clusterConfig.sshConfig.port || 22,
          username: clusterConfig.sshConfig.username,
          privateKey: Buffer.from(clusterConfig.sshConfig.pemFile, 'base64'),
          readyTimeout: 15000
        });
      } catch (error) {
        clearTimeout(timeout);
        resolve({ 
          success: false, 
          message: `Failed to initiate SSH connection: ${error.message}` 
        });
      }
    });
  }

  /**
   * Test kubeconfig without persisting it
   */
  async testKubeconfig(connection, kubeconfigBase64) {
    return new Promise((resolve, reject) => {
      const kubeconfig = Buffer.from(kubeconfigBase64, 'base64').toString('utf8');
      
      // Create temporary kubeconfig and test kubectl
      const testCommand = `
        mkdir -p /tmp/k8s-test-$$ && 
        cat > /tmp/k8s-test-$$/config << 'EOF'
${kubeconfig}
EOF
        KUBECONFIG=/tmp/k8s-test-$$/config kubectl version --client --output=json && 
        rm -rf /tmp/k8s-test-$$
      `;

      connection.exec(testCommand, (err, stream) => {
        if (err) {
          reject(new Error(`Failed to test kubeconfig: ${err.message}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Kubeconfig test completed successfully');
            resolve();
          } else {
            reject(new Error(`Kubeconfig test failed: ${errorOutput}`));
          }
        });
      });
    });
  }

  /**
   * Close connection to cluster
   */
  closeConnection(clusterId) {
    const connectionInfo = this.activeConnections.get(clusterId);
    if (connectionInfo) {
      connectionInfo.connection.end();
      this.activeConnections.delete(clusterId);
      // Remove connection record from database
      this.db.removeConnectionRecord(clusterId).catch(console.error);
      console.log(`🔌 Closed connection to cluster ${clusterId}`);
    }
  }

  /**
   * Close all connections
   */
  closeAllConnections() {
    for (const [clusterId] of this.activeConnections) {
      this.closeConnection(clusterId);
    }
  }

  /**
   * Get connection status for all clusters
   */
  async getConnectionStatus() {
    return await this.getClusters();
  }
}

module.exports = ClusterManager;
