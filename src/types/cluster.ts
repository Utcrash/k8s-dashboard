// Cluster configuration types
export interface SSHConfig {
  host: string;           // Bastion host IP or hostname
  username: string;       // SSH username (e.g., 'ubuntu', 'ec2-user')
  pemFile: string;        // Base64 encoded PEM file content
  port: number;           // SSH port (default: 22)
}

export interface AWSConfig {
  region: string;
  accountId?: string;
  vpcId?: string;
}

export interface ClusterConfig {
  id: string;
  name: string;
  region?: string;
  environment: 'dev' | 'staging' | 'prod' | 'test';
  
  // SSH Configuration for accessing the cluster
  sshConfig: SSHConfig;
  
  // Base64 encoded kubeconfig content
  kubeconfig: string;
  
  // Optional AWS metadata
  awsConfig?: AWSConfig;
  
  // Timestamps
  createdAt?: string;
  lastAccessed?: string;
}

export interface ClusterSummary {
  id: string;
  name: string;
  region?: string;
  environment: 'dev' | 'staging' | 'prod' | 'test';
  createdAt?: string;
  lastAccessed?: string;
  isConnected: boolean;
  connectionInfo?: string;
}

export interface ClusterConnectionStatus {
  clusterId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  connectedAt?: string;
  error?: string;
}

export interface ClusterTestResult {
  success: boolean;
  message: string;
  clientVersion?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ClusterApiResponse extends ApiResponse {
  clusterId?: string;
  clusters?: ClusterSummary[];
  cluster?: ClusterSummary;
}

// Form types for cluster setup
export interface ClusterFormData {
  name: string;
  region: string;
  environment: 'dev' | 'staging' | 'prod' | 'test';
  sshHost: string;
  sshUsername: string;
  sshPort: string;
  pemFileContent: string;
  kubeconfigContent: string;
}

export interface ClusterFormErrors {
  name?: string;
  region?: string;
  environment?: string;
  sshHost?: string;
  sshUsername?: string;
  sshPort?: string;
  pemFileContent?: string;
  kubeconfigContent?: string;
}

// Context types
export interface ClusterContextType {
  clusters: ClusterSummary[];
  selectedCluster: ClusterSummary | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadClusters: () => Promise<void>;
  addCluster: (config: ClusterConfig) => Promise<void>;
  updateCluster: (clusterId: string, config: ClusterConfig) => Promise<void>;
  removeCluster: (clusterId: string) => Promise<void>;
  selectCluster: (clusterId: string) => void;
  connectToCluster: (clusterId: string) => Promise<void>;
  disconnectFromCluster: (clusterId: string) => Promise<void>;
  testClusterConnection: (config: ClusterConfig) => Promise<ClusterTestResult>;
}
