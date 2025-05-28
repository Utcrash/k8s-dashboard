import axios, { AxiosInstance } from 'axios';
import { KubeConfig } from '../context/KubeConfigContext';

// Create a map to store axios instances for different configs
const configInstances = new Map<string, AxiosInstance>();

// Function to create an axios instance for a specific kubeconfig
export const createConfigInstance = (config: KubeConfig): AxiosInstance => {
    // If it's the default kubectl proxy config, use the existing setup
    if (config.isDefault) {
        return axios.create({
            baseURL: '/k8s-api',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });
    }

    // For kubeconfig-based connections, we need to handle authentication
    // Note: Direct cluster access from browser may be limited by CORS policies
    const instance = axios.create({
        baseURL: config.server,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 10000
    });

    // Add authentication based on the kubeconfig
    if (config.config) {
        const currentContext = config.config.contexts.find((ctx: any) =>
            ctx.name === config.config['current-context']
        );

        if (currentContext) {
            const user = config.config.users.find((u: any) =>
                u.name === currentContext.context.user
            );

            if (user && user.user) {
                // Handle different authentication methods
                if (user.user.token) {
                    // Bearer token authentication
                    instance.defaults.headers.common['Authorization'] = `Bearer ${user.user.token}`;
                } else if (user.user['client-certificate-data'] && user.user['client-key-data']) {
                    // Client certificate authentication
                    // Note: This requires additional setup for browser environments
                    // In a real implementation, you might need a backend proxy for cert auth
                    console.warn('Client certificate authentication requires backend proxy support');
                } else if (user.user.username && user.user.password) {
                    // Basic authentication
                    const credentials = btoa(`${user.user.username}:${user.user.password}`);
                    instance.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
                }
            }
        }
    }

    // Add response interceptor for error handling
    instance.interceptors.response.use(
        response => response,
        error => {
            console.error('Kubeconfig API Error:', error.response?.data || error.message);

            // Handle CORS issues by suggesting proxy setup
            if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
                throw new Error(
                    'Network error: This might be due to CORS restrictions. ' +
                    'Consider setting up a backend proxy for direct cluster access.'
                );
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Get or create an axios instance for a specific config
export const getConfigInstance = (config: KubeConfig): AxiosInstance => {
    if (!configInstances.has(config.id)) {
        const instance = createConfigInstance(config);
        configInstances.set(config.id, instance);
    }
    return configInstances.get(config.id)!;
};

// Clear cached instance when config is removed
export const clearConfigInstance = (configId: string): void => {
    configInstances.delete(configId);
};

// Test connection to a cluster
export const testConnection = async (config: KubeConfig): Promise<boolean> => {
    try {
        const instance = getConfigInstance(config);
        await instance.get('/api/v1/namespaces');
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
};

// Extract cluster info from kubeconfig
export const getClusterInfo = (config: KubeConfig) => {
    if (!config.config) {
        return {
            name: config.name,
            server: config.server,
            context: 'kubectl-proxy'
        };
    }

    const currentContext = config.config.contexts.find((ctx: any) =>
        ctx.name === config.config['current-context']
    );

    return {
        name: config.name,
        server: config.server,
        context: config.config['current-context'],
        cluster: currentContext?.context?.cluster,
        namespace: currentContext?.context?.namespace || 'default'
    };
}; 