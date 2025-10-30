import axios from 'axios';

// Add the DEFAULT_NAMESPACE constant at the top of the file
// Get the default namespace from environment variables
const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'appveen';

// Base URL for the Kubernetes API
// When running locally, we'll need to proxy requests to the K8s API
const API_BASE_URL = '/k8s-api';  // Always use /k8s-api for all environments

// Configure axios with a timeout
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000  // 10 second timeout
});

// Create a separate instance for log requests with a longer timeout
const logApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000  // 30 second timeout for logs
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

logApi.interceptors.response.use(
    response => response,
    error => {
        console.error('Log API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Add request interceptor to include authentication token
const addAuthToken = (config: any) => {
    const token = localStorage.getItem('k8s_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use(addAuthToken);
logApi.interceptors.request.use(addAuthToken);

// Namespaces
export const getNamespaces = async () => {
    const response = await api.get('/api/v1/namespaces');
    return response.data;
};

// Pods
export const getPods = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/pods`);
    return response.data;
};

export const getPodLogs = async (
    podName: string,
    namespace = DEFAULT_NAMESPACE,
    container?: string,
    tailLines = 1000,
    sinceSeconds?: number
) => {
    // Build query parameters for log request
    const params = new URLSearchParams();

    if (container) {
        params.append('container', container);
    }

    // Limit the number of log lines to avoid massive responses
    params.append('tailLines', tailLines.toString());

    // Optionally filter logs by time
    if (sinceSeconds) {
        params.append('sinceSeconds', sinceSeconds.toString());
    }

    try {
        const url = `/api/v1/namespaces/${namespace}/pods/${podName}/log?${params.toString()}`;
        const response = await logApi.get(url);
        return response.data;
    } catch (error: any) {
        // If timeout or other error, suggest using streaming
        if (error.code === 'ECONNABORTED') {
            return "Log request timed out. The log file might be too large. Try using streaming mode or reduce the number of lines.";
        }
        throw error;
    }
};

// Stream pod logs with the follow parameter
export const streamPodLogs = (
    podName: string,
    namespace = DEFAULT_NAMESPACE,
    container?: string,
    onLogChunk?: (logChunk: string) => void,
    onError?: (error: string) => void,
    tailLines = 200
) => {
    // Create AbortController to allow canceling the streaming request
    const controller = new AbortController();
    const { signal } = controller;

    // Build URL with params
    let url = `${API_BASE_URL}/api/v1/namespaces/${namespace}/pods/${podName}/log?follow=true&tailLines=${tailLines}`;
    if (container) {
        url += `&container=${container}`;
    }

    // Get any authentication headers that might be in the current session
    const headers: Record<string, string> = {};
    if (typeof document !== 'undefined') {
        // If we're in a browser context, try to get the Authorization header
        const authToken = localStorage.getItem('k8s_auth_token');
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
    }

    // Use fetch with streaming response
    (async () => {
        try {
            const response = await fetch(url, {
                signal,
                credentials: 'include', // Include cookies in the request
                headers
            });

            if (!response.ok) {
                throw new Error(`Error fetching logs: ${response.status} ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('ReadableStream not supported in this browser.');
            }

            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process any remaining logs in buffer
                    if (buffer.length > 0 && onLogChunk) {
                        onLogChunk(buffer);
                    }
                    break;
                }

                // Decode and process log chunks
                const text = decoder.decode(value, { stream: true });
                buffer += text;

                // Process each complete line
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                if (lines.length > 0 && onLogChunk) {
                    // Send complete lines to callback
                    lines.forEach(line => {
                        if (line.trim()) onLogChunk(line);
                    });
                }
            }
        } catch (error: any) {
            // Don't report if it was manually aborted
            if (error.name !== 'AbortError' && onError) {
                onError(error.message || 'Unknown error occurred while streaming logs');
            }
        }
    })();

    // Return a function to cancel the streaming
    return () => controller.abort();
};

export const getPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const updatePod = async (name: string, namespace = DEFAULT_NAMESPACE, podYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/pods/${name}`,
        podYaml
    );
    return response.data;
};

export const deletePod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const restartPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    // Kubernetes doesn't have a direct "restart" API
    // We'll use the deletePod method and let the deployment/statefulset controller recreate it
    return deletePod(name, namespace);
};

// Services
export const getServices = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/services`);
    return response.data;
};

export const getService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

export const updateService = async (name: string, namespace = DEFAULT_NAMESPACE, serviceYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/services/${name}`,
        serviceYaml
    );
    return response.data;
};

export const deleteService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

// Deployments
export const getDeployments = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments`);
    return response.data;
};

export const getDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const updateDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, deploymentYaml: any) => {
    const response = await api.put(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
        deploymentYaml
    );
    return response.data;
};

export const deleteDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const restartDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    // To restart a deployment, we can add a unique annotation to force a rolling update
    const deployment = await getDeployment(name, namespace);
    if (!deployment.spec.template.metadata.annotations) {
        deployment.spec.template.metadata.annotations = {};
    }

    // Add or update the restart timestamp annotation
    deployment.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();

    return updateDeployment(name, namespace, deployment);
};

// ConfigMaps
export const getConfigMaps = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps`);
    return response.data;
};

export const getConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

export const updateConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE, configMapYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/configmaps/${name}`,
        configMapYaml
    );
    return response.data;
};

export const deleteConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

// ServiceAccounts
export const getServiceAccounts = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts`);
    return response.data;
};

export const getServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

export const updateServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE, serviceAccountYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/serviceaccounts/${name}`,
        serviceAccountYaml
    );
    return response.data;
};

export const deleteServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

// Secrets
export const getSecrets = async (namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/secrets`);
    return response.data;
};

export const getSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/secrets/${name}`);
    return response.data;
};

export const createSecret = async (namespace = DEFAULT_NAMESPACE, secretData: any) => {
    const response = await api.post(
        `/api/v1/namespaces/${namespace}/secrets`,
        secretData
    );
    return response.data;
};

export const updateSecret = async (name: string, namespace = DEFAULT_NAMESPACE, secretYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/secrets/${name}`,
        secretYaml
    );
    return response.data;
};

export const deleteSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/secrets/${name}`);
    return response.data;
};

// Scale Deployments
export const scaleDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, replicas: number) => {
    // First get the current deployment to preserve other properties
    const deployment = await getDeployment(name, namespace);

    // Update the replica count
    deployment.spec.replicas = replicas;

    // Update the deployment
    const response = await api.put(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
        deployment
    );

    return response.data;
};

export default api;