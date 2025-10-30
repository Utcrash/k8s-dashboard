// Temporary mock overlay for testing - intercepts real API calls
import {
  mockNamespaces,
  mockPods,
  mockDeployments,
  mockServices,
  mockConfigMaps,
  mockServiceAccounts,
  mockSecrets,
  getDataForNamespace,
  simulateApiDelay,
} from './mockData';

const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'appveen';

// Override the real API functions with mock versions
export const getNamespaces = async () => {
  await simulateApiDelay(300);
  return { items: mockNamespaces };
};

export const getPods = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(400);
  return { items: getDataForNamespace(mockPods, namespace) };
};

export const getDeployments = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(450);
  return { items: getDataForNamespace(mockDeployments, namespace) };
};

export const getServices = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(350);
  return { items: getDataForNamespace(mockServices, namespace) };
};

export const getConfigMaps = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(300);
  return { items: getDataForNamespace(mockConfigMaps, namespace) };
};

export const getServiceAccounts = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(250);
  return { items: getDataForNamespace(mockServiceAccounts, namespace) };
};

export const getSecrets = async (namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(300);
  return { items: getDataForNamespace(mockSecrets, namespace) };
};

export const getPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const pods = getDataForNamespace(mockPods, namespace);
  return pods.find(pod => pod.metadata.name === name) || null;
};

export const getPodLogs = async (
  podName: string,
  namespace = DEFAULT_NAMESPACE,
  container?: string,
  tailLines?: number,
  sinceSeconds?: number
) => {
  await simulateApiDelay(600);
  
  const mockLogs = [
    `[${new Date().toISOString()}] INFO: Starting application in ${namespace} namespace`,
    `[${new Date().toISOString()}] INFO: Pod ${podName} initialized successfully`,
    `[${new Date().toISOString()}] DEBUG: Loading configuration from ConfigMap`,
    `[${new Date().toISOString()}] INFO: Database connection established`,
    `[${new Date().toISOString()}] INFO: Server listening on port 8080`,
    `[${new Date().toISOString()}] INFO: Health check endpoint available at /health`,
    `[${new Date().toISOString()}] DEBUG: Processing incoming request`,
    `[${new Date().toISOString()}] INFO: Request processed successfully`,
    `[${new Date().toISOString()}] DEBUG: Memory usage: 45% of 512Mi`,
    `[${new Date().toISOString()}] INFO: Application running normally in ${namespace}`,
  ];
  
  return tailLines ? mockLogs.slice(-tailLines) : mockLogs;
};

export const streamPodLogs = (
  podName: string,
  namespace = DEFAULT_NAMESPACE,
  container?: string,
  onLogChunk?: (logChunk: string) => void,
  onError?: (error: string) => void,
  tailLines = 200
) => {
  console.log(`Mock: Streaming logs for pod ${podName} in namespace ${namespace}`);
  
  const logMessages = [
    `Starting log stream for ${podName} in ${namespace}...`,
    'Application initialized',
    'Processing requests...',
    'Health check passed',
    'Memory usage normal',
    'All systems operational',
  ];
  
  let index = 0;
  const interval = setInterval(() => {
    if (index < logMessages.length && onLogChunk) {
      const timestamp = new Date().toISOString();
      onLogChunk(`[${timestamp}] INFO: ${logMessages[index]}`);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 2000);
  
  return () => {
    clearInterval(interval);
    console.log('Mock: Log stream stopped');
  };
};

// Stub implementations for other functions
export const updatePod = async (name: string, namespace = DEFAULT_NAMESPACE, podYaml: any) => {
  await simulateApiDelay(600);
  console.log(`Mock: Updated pod ${name} in namespace ${namespace}`);
  return { success: true, message: 'Pod updated successfully (mock)' };
};

export const deletePod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(500);
  console.log(`Mock: Deleted pod ${name} in namespace ${namespace}`);
  return { success: true, message: 'Pod deleted successfully (mock)' };
};

export const restartPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(800);
  console.log(`Mock: Restarted pod ${name} in namespace ${namespace}`);
  return { success: true, message: 'Pod restarted successfully (mock)' };
};

export const getDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const deployments = getDataForNamespace(mockDeployments, namespace);
  return deployments.find(deployment => deployment.metadata.name === name) || null;
};

export const updateDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, deploymentYaml: any) => {
  await simulateApiDelay(700);
  console.log(`Mock: Updated deployment ${name} in namespace ${namespace}`);
  return { success: true, message: 'Deployment updated successfully (mock)' };
};

export const deleteDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(600);
  console.log(`Mock: Deleted deployment ${name} in namespace ${namespace}`);
  return { success: true, message: 'Deployment deleted successfully (mock)' };
};

export const restartDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(900);
  console.log(`Mock: Restarted deployment ${name} in namespace ${namespace}`);
  return { success: true, message: 'Deployment restarted successfully (mock)' };
};

export const scaleDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, replicas: number) => {
  await simulateApiDelay(800);
  console.log(`Mock: Scaled deployment ${name} in namespace ${namespace} to ${replicas} replicas`);
  return { success: true, message: `Deployment scaled to ${replicas} replicas (mock)` };
};

// Stub other functions with minimal implementations
export const getService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const services = getDataForNamespace(mockServices, namespace);
  return services.find(service => service.metadata.name === name) || null;
};

export const updateService = async (name: string, namespace = DEFAULT_NAMESPACE, serviceYaml: any) => {
  await simulateApiDelay(600);
  return { success: true, message: 'Service updated successfully (mock)' };
};

export const deleteService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(500);
  return { success: true, message: 'Service deleted successfully (mock)' };
};

export const getConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const configMaps = getDataForNamespace(mockConfigMaps, namespace);
  return configMaps.find(cm => cm.metadata.name === name) || null;
};

export const updateConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE, configMapYaml: any) => {
  await simulateApiDelay(500);
  return { success: true, message: 'ConfigMap updated successfully (mock)' };
};

export const deleteConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(400);
  return { success: true, message: 'ConfigMap deleted successfully (mock)' };
};

export const getServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const serviceAccounts = getDataForNamespace(mockServiceAccounts, namespace);
  return serviceAccounts.find(sa => sa.metadata.name === name) || null;
};

export const updateServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE, serviceAccountYaml: any) => {
  await simulateApiDelay(500);
  return { success: true, message: 'ServiceAccount updated successfully (mock)' };
};

export const deleteServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(400);
  return { success: true, message: 'ServiceAccount deleted successfully (mock)' };
};

export const getSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(200);
  const secrets = getDataForNamespace(mockSecrets, namespace);
  return secrets.find(secret => secret.metadata.name === name) || null;
};

export const createSecret = async (namespace = DEFAULT_NAMESPACE, secretData: any) => {
  await simulateApiDelay(600);
  return { success: true, message: 'Secret created successfully (mock)' };
};

export const updateSecret = async (name: string, namespace = DEFAULT_NAMESPACE, secretYaml: any) => {
  await simulateApiDelay(500);
  return { success: true, message: 'Secret updated successfully (mock)' };
};

export const deleteSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
  await simulateApiDelay(400);
  return { success: true, message: 'Secret deleted successfully (mock)' };
};
