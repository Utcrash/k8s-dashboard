import axios from 'axios';

// Base URL for the Kubernetes API
// When running locally, we'll need to proxy requests to the K8s API
const API_BASE_URL = '';  // Empty string to use relative URLs

// Configure axios with a timeout
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000  // 10 second timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Namespaces
export const getNamespaces = async () => {
    const response = await api.get('/api/v1/namespaces');
    return response.data;
};

// Pods
export const getPods = async (namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/pods`);
    return response.data;
};

export const getPodLogs = async (podName: string, namespace = 'default', container?: string) => {
    let url = `/api/v1/namespaces/${namespace}/pods/${podName}/log`;
    if (container) {
        url += `?container=${container}`;
    }
    const response = await api.get(url);
    return response.data;
};

// Stream pod logs with the follow parameter
export const streamPodLogs = (
    podName: string,
    namespace = 'default',
    onLogChunk: (logChunk: string) => void,
    onError: (error: Error) => void,
    container?: string,
    tailLines = 100
) => {
    // Create AbortController to allow canceling the streaming request
    const controller = new AbortController();
    const { signal } = controller;

    // Build URL with params
    let url = `/api/v1/namespaces/${namespace}/pods/${podName}/log?follow=true&tailLines=${tailLines}`;
    if (container) {
        url += `&container=${container}`;
    }

    // Use fetch with streaming response
    (async () => {
        try {
            const response = await fetch(url, { signal });

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
                    if (buffer.length > 0) {
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

                if (lines.length > 0) {
                    // Send complete lines to callback
                    lines.forEach(line => {
                        if (line.trim()) onLogChunk(line);
                    });
                }
            }
        } catch (error: any) {
            // Don't report if it was manually aborted
            if (error.name !== 'AbortError') {
                onError(new Error(error.message || 'Unknown error occurred while streaming logs'));
            }
        }
    })();

    // Return a function to cancel the streaming
    return () => controller.abort();
};

export const getPod = async (name: string, namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const updatePod = async (name: string, namespace = 'default', podYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/pods/${name}`,
        podYaml
    );
    return response.data;
};

export const deletePod = async (name: string, namespace = 'default') => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const restartPod = async (name: string, namespace = 'default') => {
    // Kubernetes doesn't have a direct "restart" API
    // We'll use the deletePod method and let the deployment/statefulset controller recreate it
    return deletePod(name, namespace);
};

// Services
export const getServices = async (namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/services`);
    return response.data;
};

export const getService = async (name: string, namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

export const updateService = async (name: string, namespace = 'default', serviceYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/services/${name}`,
        serviceYaml
    );
    return response.data;
};

export const deleteService = async (name: string, namespace = 'default') => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

// Deployments
export const getDeployments = async (namespace = 'default') => {
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments`);
    return response.data;
};

export const getDeployment = async (name: string, namespace = 'default') => {
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const updateDeployment = async (name: string, namespace = 'default', deploymentYaml: any) => {
    const response = await api.put(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
        deploymentYaml
    );
    return response.data;
};

export const deleteDeployment = async (name: string, namespace = 'default') => {
    const response = await api.delete(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const restartDeployment = async (name: string, namespace = 'default') => {
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
export const getConfigMaps = async (namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps`);
    return response.data;
};

export const getConfigMap = async (name: string, namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

export const updateConfigMap = async (name: string, namespace = 'default', configMapYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/configmaps/${name}`,
        configMapYaml
    );
    return response.data;
};

export const deleteConfigMap = async (name: string, namespace = 'default') => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

// ServiceAccounts
export const getServiceAccounts = async (namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts`);
    return response.data;
};

export const getServiceAccount = async (name: string, namespace = 'default') => {
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

export const updateServiceAccount = async (name: string, namespace = 'default', serviceAccountYaml: any) => {
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/serviceaccounts/${name}`,
        serviceAccountYaml
    );
    return response.data;
};

export const deleteServiceAccount = async (name: string, namespace = 'default') => {
    const response = await api.delete(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

// Nodes
export const getNodes = async () => {
    const response = await api.get('/api/v1/nodes');
    return response.data;
};

export const getNode = async (name: string) => {
    const response = await api.get(`/api/v1/nodes/${name}`);
    return response.data;
};

export const getNodeMetrics = async (name?: string) => {
    if (name) {
        const response = await api.get(`/apis/metrics.k8s.io/v1beta1/nodes/${name}`);
        return response.data;
    } else {
        const response = await api.get('/apis/metrics.k8s.io/v1beta1/nodes');
        return response.data;
    }
};

// YAML Operations
export const getResourceYaml = async (
    kind: string,
    name: string,
    namespace: string
): Promise<string> => {
    const response = await api.get(
        `/api/resources/${kind}/${namespace}/${name}/yaml`
    );
    return response.data;
};

export const updateResourceYaml = async (
    kind: string,
    name: string,
    namespace: string,
    yaml: string
): Promise<any> => {
    const response = await api.put(
        `/api/resources/${kind}/${namespace}/${name}/yaml`,
        { yaml }
    );
    return response.data;
};

export default api; 