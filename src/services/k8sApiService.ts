import { ApiResponse } from '../types/cluster';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';

class K8sApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/k8s`;
  }

  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Namespaces
  async getNamespaces(clusterId: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces`);
  }

  // Pods
  async getPods(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/pods`);
  }

  async getPod(clusterId: string, namespace: string, podName: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/pods/${podName}`);
  }

  async getPodLogs(
    clusterId: string, 
    namespace: string, 
    podName: string, 
    options: {
      container?: string;
      tail?: number;
      follow?: boolean;
    } = {}
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (options.container) params.append('container', options.container);
    if (options.tail) params.append('tail', options.tail.toString());
    if (options.follow) params.append('follow', options.follow.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/${clusterId}/namespaces/${namespace}/pods/${podName}/logs${query}`);
  }

  // Deployments
  async getDeployments(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/deployments`);
  }

  async scaleDeployment(
    clusterId: string, 
    namespace: string, 
    deploymentName: string, 
    replicas: number
  ): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/deployments/${deploymentName}/scale`, {
      method: 'PATCH',
      body: JSON.stringify({ replicas }),
    });
  }

  // Services
  async getServices(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/services`);
  }

  // ConfigMaps
  async getConfigMaps(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/configmaps`);
  }

  // Secrets
  async getSecrets(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/secrets`);
  }

  // Service Accounts
  async getServiceAccounts(clusterId: string, namespace: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/namespaces/${namespace}/serviceaccounts`);
  }

  // Generic kubectl command execution
  async executeKubectl(clusterId: string, command: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/kubectl`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }
}

export const k8sApi = new K8sApiService();
