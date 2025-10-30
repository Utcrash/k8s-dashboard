import { ClusterConfig, ClusterApiResponse, ClusterTestResult, ApiResponse } from '../types/cluster';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';

class ClusterApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/clusters`;
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

  // Get all clusters
  async getClusters(): Promise<ClusterApiResponse> {
    return this.request('/');
  }

  // Add new cluster
  async addCluster(config: ClusterConfig): Promise<ClusterApiResponse> {
    // Use name as ID, ensure name is provided
    if (!config.name?.trim()) {
      throw new Error('Cluster name is required');
    }
    
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Get specific cluster
  async getCluster(clusterId: string): Promise<ClusterApiResponse> {
    return this.request(`/${clusterId}`);
  }

  // Update cluster
  async updateCluster(clusterId: string, config: ClusterConfig): Promise<ClusterApiResponse> {
    // Ensure name is provided
    if (!config.name?.trim()) {
      throw new Error('Cluster name is required');
    }
    
    return this.request(`/${clusterId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Remove cluster
  async removeCluster(clusterId: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}`, {
      method: 'DELETE',
    });
  }

  // Connect to cluster
  async connectToCluster(clusterId: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/connect`, {
      method: 'POST',
    });
  }

  // Disconnect from cluster
  async disconnectFromCluster(clusterId: string): Promise<ApiResponse> {
    return this.request(`/${clusterId}/disconnect`, {
      method: 'POST',
    });
  }

  // Test cluster connection (without storing data)
  async testConnection(config: ClusterConfig): Promise<ClusterTestResult> {
    return this.request('/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Get connection status for all clusters
  async getConnectionStatus(): Promise<ClusterApiResponse> {
    return this.request('/status/all');
  }
}

export const clusterApi = new ClusterApiService();
