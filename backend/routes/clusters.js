const express = require('express');
const ClusterManager = require('../services/ClusterManager');

const router = express.Router();
const clusterManager = ClusterManager.getInstance();

// Get all clusters
router.get('/', async (req, res) => {
  try {
    const clusters = await clusterManager.getClusters();
    res.json({ success: true, clusters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new cluster
router.post('/', async (req, res) => {
  try {
    const { name, region, environment, sshConfig, kubeconfig } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Cluster name is required' });
    }
    
    // Use cluster name as the unique identifier
    const clusterConfig = {
      id: name.trim(),
      name: name.trim(),
      region,
      environment,
      sshConfig,
      kubeconfig
    };

    const result = await clusterManager.addCluster(clusterConfig);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get specific cluster
router.get('/:clusterId', async (req, res) => {
  try {
    const cluster = await clusterManager.getCluster(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Cluster not found' });
    }
    
    // Don't return sensitive data
    const { sshConfig, kubeconfig, ...safeCluster } = cluster;
    res.json({ success: true, cluster: safeCluster });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get full cluster details for editing (includes sensitive data)
router.get('/:clusterId/full', async (req, res) => {
  try {
    const cluster = await clusterManager.getCluster(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Cluster not found' });
    }
    
    // Return full cluster data including sensitive information for editing
    // In a production environment, this should have additional authentication/authorization
    res.json({ success: true, cluster });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update cluster
router.put('/:clusterId', async (req, res) => {
  try {
    const { name, region, environment, sshConfig, kubeconfig } = req.body;
    const clusterId = req.params.clusterId;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Cluster name is required' });
    }
    
    // Check if name changed and if new name conflicts with existing cluster
    if (name.trim() !== clusterId) {
      const existingCluster = await clusterManager.getCluster(name.trim());
      if (existingCluster) {
        return res.status(400).json({ success: false, error: 'Cluster name already exists' });
      }
    }
    
    const clusterConfig = {
      id: name.trim(), // Use name as ID
      name: name.trim(),
      region,
      environment,
      sshConfig,
      kubeconfig
    };

    // If name changed, we need to remove old cluster and add new one
    if (name.trim() !== clusterId) {
      // Disconnect from old cluster first
      clusterManager.closeConnection(clusterId);
      
      // Remove old cluster
      await clusterManager.removeCluster(clusterId);
      
      // Add updated cluster with new name
      const result = await clusterManager.addCluster(clusterConfig);
      res.json({ success: true, ...result, nameChanged: true, oldId: clusterId, newId: name.trim() });
    } else {
      // Update existing cluster
      const result = await clusterManager.updateCluster(clusterId, clusterConfig);
      res.json({ success: true, ...result });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete cluster
router.delete('/:clusterId', async (req, res) => {
  try {
    const result = await clusterManager.removeCluster(req.params.clusterId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect to cluster
router.post('/:clusterId/connect', async (req, res) => {
  try {
    const result = await clusterManager.connectToCluster(req.params.clusterId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect from cluster
router.post('/:clusterId/disconnect', (req, res) => {
  try {
    clusterManager.closeConnection(req.params.clusterId);
    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test cluster connection (without storing data)
router.post('/test', async (req, res) => {
  try {
    const { name, region, environment, sshConfig, kubeconfig } = req.body;
    
    if (!name || !sshConfig || !kubeconfig) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, sshConfig, kubeconfig' 
      });
    }
    
    const clusterConfig = {
      name,
      region,
      environment,
      sshConfig,
      kubeconfig
    };

    const result = await clusterManager.testConnection(clusterConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get connection status for all clusters
router.get('/status/all', async (req, res) => {
  try {
    const status = await clusterManager.getConnectionStatus();
    res.json({ success: true, clusters: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to inspect kubeconfig (remove in production)
router.get('/:clusterId/debug-kubeconfig', async (req, res) => {
  try {
    const cluster = await clusterManager.getCluster(req.params.clusterId);
    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Cluster not found' });
    }
    
    const kubeconfig = Buffer.from(cluster.kubeconfig, 'base64').toString('utf8');
    const lines = kubeconfig.split('\n');
    
    // Return kubeconfig with line numbers for debugging
    const numberedLines = lines.map((line, index) => `${(index + 1).toString().padStart(3, ' ')}: ${line}`);
    
    res.json({ 
      success: true, 
      kubeconfig: numberedLines.join('\n'),
      lineCount: lines.length,
      potentialIssues: lines.map((line, index) => {
        const issues = [];
        if (line.trim() && !line.startsWith('#')) {
          if (line.includes(':') && !line.trim().endsWith(':')) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === line.length - 1) {
              issues.push(`Line ${index + 1}: Missing value after colon`);
            }
          }
          if (line.includes('\t')) {
            issues.push(`Line ${index + 1}: Contains tabs (should use spaces)`);
          }
        }
        return issues;
      }).flat()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check remote kubeconfig file
router.get('/:clusterId/debug-remote-kubeconfig', async (req, res) => {
  try {
    // First try kubectl version
    let kubectlResult;
    try {
      kubectlResult = await clusterManager.executeKubectl(req.params.clusterId, 'version --client');
    } catch (error) {
      kubectlResult = { error: error.message };
    }
    
    // Check the actual file on remote server using shell commands
    const fileInfo = await clusterManager.executeShellCommand(req.params.clusterId, 'ls -la ~/.kube/config');
    const lineCount = await clusterManager.executeShellCommand(req.params.clusterId, 'wc -l ~/.kube/config');
    const fileContent = await clusterManager.executeShellCommand(req.params.clusterId, 'cat -n ~/.kube/config');
    
    res.json({ 
      success: true, 
      kubectlResult,
      fileInfo,
      lineCount,
      fileContent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
