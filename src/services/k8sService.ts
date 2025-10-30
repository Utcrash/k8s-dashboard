import { k8sApi } from './k8sApiService';

// Add the DEFAULT_NAMESPACE constant at the top of the file
// Get the default namespace from environment variables
const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'appveen';

// Helper function to get current cluster ID
const getCurrentClusterId = (): string => {
  // This will be called from React components that have access to ClusterContext
  const selectedCluster = localStorage.getItem('selectedClusterId');
  if (!selectedCluster || selectedCluster === 'null') {
    throw new Error('No cluster selected. Please select a cluster first.');
  }
  return selectedCluster;
};

// Namespaces
export const getNamespaces = async () => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getNamespaces(clusterId);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch namespaces');
  }
  return response.data;
};

// Pods
export const getPods = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getPods(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch pods');
  }
  return response.data;
};

export const getPod = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getPod(clusterId, namespace, name);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch pod');
  }
  return response.data;
};

export const getPodLogs = async (
  podName: string,
  namespace: string = DEFAULT_NAMESPACE,
  container?: string,
  tail: number = 100,
  follow: boolean = false
) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getPodLogs(clusterId, namespace, podName, {
    container,
    tail,
    follow
  });
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch pod logs');
  }
  return response.data;
};

// Deployments
export const getDeployments = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getDeployments(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch deployments');
  }
  return response.data;
};

export const scaleDeployment = async (
  deploymentName: string,
  namespace: string = DEFAULT_NAMESPACE,
  replicas: number
) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.scaleDeployment(clusterId, namespace, deploymentName, replicas);
  if (!response.success) {
    throw new Error(response.error || 'Failed to scale deployment');
  }
  return response.data;
};

// Services
export const getServices = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getServices(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch services');
  }
  return response.data;
};

// ConfigMaps
export const getConfigMaps = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getConfigMaps(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch configmaps');
  }
  return response.data;
};

// Secrets
export const getSecrets = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getSecrets(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch secrets');
  }
  return response.data;
};

// Service Accounts
export const getServiceAccounts = async (namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.getServiceAccounts(clusterId, namespace);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch service accounts');
  }
  return response.data;
};

// Generic kubectl command execution
export const executeKubectl = async (command: string) => {
  const clusterId = getCurrentClusterId();
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to execute kubectl command');
  }
  return response.data;
};

// Additional pod operations
export const updatePod = async (name: string, namespace: string = DEFAULT_NAMESPACE, podYaml: any) => {
  const clusterId = getCurrentClusterId();
  // Convert YAML to kubectl apply command
  const yamlString = typeof podYaml === 'string' ? podYaml : JSON.stringify(podYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update pod');
  }
  return response.data;
};

export const restartPod = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete pod ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to restart pod');
  }
  return response.data;
};

// Stream pod logs (simplified version - real streaming would need WebSocket)
export const streamPodLogs = (
  podName: string,
  namespace: string = DEFAULT_NAMESPACE,
  container?: string,
  onData?: (data: string) => void,
  onError?: (error: Error) => void
) => {
  let cancelled = false;
  
  const streamLogs = async () => {
    try {
      while (!cancelled) {
        const logs = await getPodLogs(podName, namespace, container, 50, false);
        if (onData && logs.raw) {
          onData(logs.raw);
        }
        // Wait 2 seconds before next fetch
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      if (onError && !cancelled) {
        onError(error instanceof Error ? error : new Error('Stream error'));
      }
    }
  };
  
  streamLogs();
  
  // Return cancel function
  return () => {
    cancelled = true;
  };
};

// Additional resource operations
export const deletePod = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete pod ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete pod');
  }
  return response.data;
};

// ConfigMap operations
export const getConfigMap = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `get configmap ${name} -n ${namespace} -o json`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to get configmap');
  }
  return response.data;
};

export const updateConfigMap = async (name: string, namespace: string = DEFAULT_NAMESPACE, configMapYaml: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof configMapYaml === 'string' ? configMapYaml : JSON.stringify(configMapYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update configmap');
  }
  return response.data;
};

export const deleteConfigMap = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete configmap ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete configmap');
  }
  return response.data;
};

// Deployment operations
export const getDeployment = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `get deployment ${name} -n ${namespace} -o json`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to get deployment');
  }
  return response.data;
};

export const updateDeployment = async (name: string, namespace: string = DEFAULT_NAMESPACE, deploymentYaml: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof deploymentYaml === 'string' ? deploymentYaml : JSON.stringify(deploymentYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update deployment');
  }
  return response.data;
};

export const deleteDeployment = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete deployment ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete deployment');
  }
  return response.data;
};

export const restartDeployment = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `rollout restart deployment ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to restart deployment');
  }
  return response.data;
};

// Secret operations
export const getSecret = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `get secret ${name} -n ${namespace} -o json`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to get secret');
  }
  return response.data;
};

export const createSecret = async (name: string, namespace: string = DEFAULT_NAMESPACE, secretData: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof secretData === 'string' ? secretData : JSON.stringify(secretData);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to create secret');
  }
  return response.data;
};

export const updateSecret = async (name: string, namespace: string = DEFAULT_NAMESPACE, secretYaml: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof secretYaml === 'string' ? secretYaml : JSON.stringify(secretYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update secret');
  }
  return response.data;
};

export const deleteSecret = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete secret ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete secret');
  }
  return response.data;
};

// Service Account operations
export const getServiceAccount = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `get serviceaccount ${name} -n ${namespace} -o json`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to get service account');
  }
  return response.data;
};

export const updateServiceAccount = async (name: string, namespace: string = DEFAULT_NAMESPACE, serviceAccountYaml: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof serviceAccountYaml === 'string' ? serviceAccountYaml : JSON.stringify(serviceAccountYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update service account');
  }
  return response.data;
};

export const deleteServiceAccount = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete serviceaccount ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete service account');
  }
  return response.data;
};

// Service operations
export const getService = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `get service ${name} -n ${namespace} -o json`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to get service');
  }
  return response.data;
};

export const updateService = async (name: string, namespace: string = DEFAULT_NAMESPACE, serviceYaml: any) => {
  const clusterId = getCurrentClusterId();
  const yamlString = typeof serviceYaml === 'string' ? serviceYaml : JSON.stringify(serviceYaml);
  const command = `apply -f - <<EOF\n${yamlString}\nEOF`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update service');
  }
  return response.data;
};

export const deleteService = async (name: string, namespace: string = DEFAULT_NAMESPACE) => {
  const clusterId = getCurrentClusterId();
  const command = `delete service ${name} -n ${namespace}`;
  const response = await k8sApi.executeKubectl(clusterId, command);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete service');
  }
  return response.data;
};

// Legacy exports for backward compatibility
export default {
  getNamespaces,
  getPods,
  getPod,
  getPodLogs,
  getDeployments,
  scaleDeployment,
  getServices,
  getConfigMaps,
  getSecrets,
  getServiceAccounts,
  executeKubectl,
  updatePod,
  restartPod,
  streamPodLogs,
  deletePod,
  getConfigMap,
  updateConfigMap,
  deleteConfigMap,
  getDeployment,
  updateDeployment,
  deleteDeployment,
  restartDeployment,
  getSecret,
  createSecret,
  updateSecret,
  deleteSecret,
  getServiceAccount,
  updateServiceAccount,
  deleteServiceAccount,
  getService,
  updateService,
  deleteService,
};