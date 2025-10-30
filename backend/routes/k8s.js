const express = require('express');
const ClusterManager = require('../services/ClusterManager');

const router = express.Router();
const clusterManager = ClusterManager.getInstance();

// Middleware to ensure cluster connection
const ensureConnection = async (req, res, next) => {
  const { clusterId } = req.params;
  
  try {
    // Check if already connected, if not, connect
    if (!clusterManager.activeConnections.has(clusterId)) {
      await clusterManager.connectToCluster(clusterId);
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: `Connection failed: ${error.message}` });
  }
};

// Get namespaces
router.get('/:clusterId/namespaces', ensureConnection, async (req, res) => {
  try {
    const result = await clusterManager.executeKubectl(
      req.params.clusterId, 
      'get namespaces -o json'
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pods in namespace
router.get('/:clusterId/namespaces/:namespace/pods', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get pods -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific pod details
router.get('/:clusterId/namespaces/:namespace/pods/:podName', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace, podName } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get pod ${podName} -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pod logs
router.get('/:clusterId/namespaces/:namespace/pods/:podName/logs', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace, podName } = req.params;
    const { container, tail = '100', follow = 'false' } = req.query;
    
    let command = `logs ${podName} -n ${namespace} --tail=${tail}`;
    if (container) command += ` -c ${container}`;
    if (follow === 'true') command += ' -f';
    
    const result = await clusterManager.executeKubectl(clusterId, command);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get deployments
router.get('/:clusterId/namespaces/:namespace/deployments', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get deployments -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scale deployment
router.patch('/:clusterId/namespaces/:namespace/deployments/:deploymentName/scale', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace, deploymentName } = req.params;
    const { replicas } = req.body;
    
    if (!replicas || replicas < 0) {
      return res.status(400).json({ success: false, error: 'Invalid replicas count' });
    }
    
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `scale deployment ${deploymentName} -n ${namespace} --replicas=${replicas}`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get services
router.get('/:clusterId/namespaces/:namespace/services', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get services -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get configmaps
router.get('/:clusterId/namespaces/:namespace/configmaps', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get configmaps -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get secrets
router.get('/:clusterId/namespaces/:namespace/secrets', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get secrets -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get service accounts
router.get('/:clusterId/namespaces/:namespace/serviceaccounts', ensureConnection, async (req, res) => {
  try {
    const { clusterId, namespace } = req.params;
    const result = await clusterManager.executeKubectl(
      clusterId, 
      `get serviceaccounts -n ${namespace} -o json`
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic kubectl command execution (for advanced users)
router.post('/:clusterId/kubectl', ensureConnection, async (req, res) => {
  try {
    const { clusterId } = req.params;
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }
    
    // Basic security: prevent dangerous commands
    const dangerousCommands = ['delete', 'rm', 'sudo', 'chmod', 'chown'];
    if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
      return res.status(403).json({ success: false, error: 'Command not allowed' });
    }
    
    const result = await clusterManager.executeKubectl(clusterId, command);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
