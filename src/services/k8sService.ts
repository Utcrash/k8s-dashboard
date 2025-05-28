import axios from 'axios';
import { getConfigInstance } from './kubeConfigService';

// Add the DEFAULT_NAMESPACE constant at the top of the file
// Get the default namespace from environment variables
const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'default';

// Function to get the current active config and its axios instance
const getActiveInstance = () => {
    // Get active config from localStorage
    const activeConfigId = localStorage.getItem('k8s_active_config');
    const savedConfigs = localStorage.getItem('k8s_configs');

    if (activeConfigId && savedConfigs) {
        try {
            const configs = JSON.parse(savedConfigs);
            const activeConfig = configs.find((c: any) => c.id === activeConfigId);
            if (activeConfig) {
                return getConfigInstance(activeConfig);
            }
        } catch (error) {
            console.error('Error getting active config:', error);
        }
    }

    // Fallback to default proxy setup
    return axios.create({
        baseURL: '/k8s-api',
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 10000
    });
};

// Create a separate instance for log requests with a longer timeout
const getActiveLogInstance = () => {
    const instance = getActiveInstance();
    // Clone the instance with longer timeout for logs
    return axios.create({
        ...instance.defaults,
        timeout: 30000
    });
};

// Namespaces
export const getNamespaces = async () => {
    const api = getActiveInstance();
    const response = await api.get('/api/v1/namespaces');
    return response.data;
};

// Pods
export const getPods = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
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
        const logApi = getActiveLogInstance();
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
    onLogChunk: (logChunk: string) => void,
    onError: (error: Error) => void,
    container?: string,
    tailLines = 200
) => {
    // Create AbortController to allow canceling the streaming request
    const controller = new AbortController();
    const { signal } = controller;

    // Get the active config to determine the base URL and auth
    const activeConfigId = localStorage.getItem('k8s_active_config');
    const savedConfigs = localStorage.getItem('k8s_configs');

    let baseURL = '/k8s-api';
    let headers: Record<string, string> = {};

    if (activeConfigId && savedConfigs) {
        try {
            const configs = JSON.parse(savedConfigs);
            const activeConfig = configs.find((c: any) => c.id === activeConfigId);
            if (activeConfig && !activeConfig.isDefault) {
                baseURL = activeConfig.server;
                // Add authentication headers if available
                if (activeConfig.config) {
                    const currentContext = activeConfig.config.contexts.find((ctx: any) =>
                        ctx.name === activeConfig.config['current-context']
                    );
                    if (currentContext) {
                        const user = activeConfig.config.users.find((u: any) =>
                            u.name === currentContext.context.user
                        );
                        if (user && user.user && user.user.token) {
                            headers['Authorization'] = `Bearer ${user.user.token}`;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error getting active config for streaming:', error);
        }
    }

    // Build URL with params
    let url = `${baseURL}/api/v1/namespaces/${namespace}/pods/${podName}/log?follow=true&tailLines=${tailLines}`;
    if (container) {
        url += `&container=${container}`;
    }

    // Use fetch with streaming response
    (async () => {
        try {
            const response = await fetch(url, {
                signal,
                credentials: 'include',
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

export const getPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const updatePod = async (name: string, namespace = DEFAULT_NAMESPACE, podYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/pods/${name}`,
        podYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deletePod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/api/v1/namespaces/${namespace}/pods/${name}`);
    return response.data;
};

export const restartPod = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    // Restart by deleting the pod (if it's managed by a deployment, it will be recreated)
    return await deletePod(name, namespace);
};

// Services
export const getServices = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/services`);
    return response.data;
};

export const getService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

export const updateService = async (name: string, namespace = DEFAULT_NAMESPACE, serviceYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/services/${name}`,
        serviceYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deleteService = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/api/v1/namespaces/${namespace}/services/${name}`);
    return response.data;
};

// Deployments
export const getDeployments = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments`);
    return response.data;
};

export const getDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const updateDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, deploymentYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
        deploymentYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deleteDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
    return response.data;
};

export const restartDeployment = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    // Restart deployment by updating the restart annotation
    const deployment = await getDeployment(name, namespace);

    if (!deployment.spec.template.metadata.annotations) {
        deployment.spec.template.metadata.annotations = {};
    }

    deployment.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();

    const response = await api.put(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`,
        deployment
    );
    return response.data;
};

// ConfigMaps
export const getConfigMaps = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps`);
    return response.data;
};

export const getConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

export const updateConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE, configMapYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/configmaps/${name}`,
        configMapYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deleteConfigMap = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/api/v1/namespaces/${namespace}/configmaps/${name}`);
    return response.data;
};

// Service Accounts
export const getServiceAccounts = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts`);
    return response.data;
};

export const getServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

export const updateServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE, serviceAccountYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/serviceaccounts/${name}`,
        serviceAccountYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deleteServiceAccount = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/api/v1/namespaces/${namespace}/serviceaccounts/${name}`);
    return response.data;
};

// Secrets
export const getSecrets = async (namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/secrets`);
    return response.data;
};

export const getSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/secrets/${name}`);
    return response.data;
};

export const createSecret = async (namespace = DEFAULT_NAMESPACE, secretData: any) => {
    const api = getActiveInstance();
    const response = await api.post(
        `/api/v1/namespaces/${namespace}/secrets`,
        secretData
    );
    return response.data;
};

export const updateSecret = async (name: string, namespace = DEFAULT_NAMESPACE, secretYaml: any) => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/secrets/${name}`,
        secretYaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export const deleteSecret = async (name: string, namespace = DEFAULT_NAMESPACE) => {
    const api = getActiveInstance();
    const response = await api.delete(`/api/v1/namespaces/${namespace}/secrets/${name}`);
    return response.data;
};

// Scale deployment
export const scaleDeployment = async (name: string, namespace = DEFAULT_NAMESPACE, replicas: number) => {
    const api = getActiveInstance();
    const scalePayload = {
        spec: {
            replicas: replicas
        }
    };

    const response = await api.patch(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}/scale`,
        scalePayload,
        {
            headers: {
                'Content-Type': 'application/merge-patch+json',
            },
        }
    );
    return response.data;
};

// Nodes
export const getNodes = async () => {
    const api = getActiveInstance();
    const response = await api.get('/api/v1/nodes');
    return response.data;
};

export const getNode = async (name: string) => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/nodes/${name}`);
    return response.data;
};

export const getNodeMetrics = async () => {
    const api = getActiveInstance();
    try {
        const response = await api.get('/apis/metrics.k8s.io/v1beta1/nodes');
        return response.data;
    } catch (error: any) {
        // If metrics server is not available, return empty data
        if (error.response?.status === 404) {
            return { items: [] };
        }
        throw error;
    }
};

// Generic YAML operations
export const getResourceYaml = async (
    kind: string,
    name: string,
    namespace: string
): Promise<string> => {
    const api = getActiveInstance();
    const response = await api.get(`/api/v1/namespaces/${namespace}/${kind}s/${name}`, {
        headers: {
            'Accept': 'application/yaml',
        },
    });
    return response.data;
};

export const updateResourceYaml = async (
    kind: string,
    name: string,
    namespace: string,
    yaml: string
): Promise<any> => {
    const api = getActiveInstance();
    const response = await api.put(
        `/api/v1/namespaces/${namespace}/${kind}s/${name}`,
        yaml,
        {
            headers: {
                'Content-Type': 'application/yaml',
            },
        }
    );
    return response.data;
};

export default getActiveInstance(); 