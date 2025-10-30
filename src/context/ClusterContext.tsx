import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClusterContextType, ClusterSummary, ClusterConfig, ClusterTestResult } from '../types/cluster';
import { clusterApi } from '../services/clusterApi';
import { clusterEvents } from '../utils/clusterEvents';

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

export const useCluster = () => {
  const context = useContext(ClusterContext);
  if (context === undefined) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
};

interface ClusterProviderProps {
  children: ReactNode;
}

export const ClusterProvider: React.FC<ClusterProviderProps> = ({ children }) => {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load clusters on mount
  useEffect(() => {
    loadClusters();
  }, []);

  // Load selected cluster from localStorage
  useEffect(() => {
    const savedClusterId = localStorage.getItem('selectedClusterId');
    if (savedClusterId && clusters.length > 0) {
      const cluster = clusters.find(c => c.id === savedClusterId);
      if (cluster) {
        setSelectedCluster(cluster);
      }
    } else if (clusters.length > 0 && !selectedCluster) {
      // Auto-select first cluster if none selected
      setSelectedCluster(clusters[0]);
    }
  }, [clusters, selectedCluster]);

  const loadClusters = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await clusterApi.getClusters();
      if (response.success && response.clusters) {
        setClusters(response.clusters);
      } else {
        throw new Error(response.error || 'Failed to load clusters');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clusters';
      setError(errorMessage);
      console.error('Error loading clusters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCluster = async (config: ClusterConfig) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await clusterApi.addCluster(config);
      if (response.success) {
        await loadClusters(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to add cluster');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cluster';
      setError(errorMessage);
      throw err; // Re-throw for form handling
    } finally {
      setIsLoading(false);
    }
  };

  const updateCluster = async (clusterId: string, config: ClusterConfig) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await clusterApi.updateCluster(clusterId, config);
      if (response.success) {
        // Handle name change scenario
        if ((response as any).nameChanged) {
          const { oldId, newId } = response as any;
          
          // Update local state - remove old and add new
          setClusters(prev => prev.filter(c => c.id !== oldId));
          await loadClusters(); // Reload to get updated cluster
          
          // Update selection if the updated cluster was selected
          if (selectedCluster?.id === oldId) {
            const updatedCluster = clusters.find(c => c.id === newId);
            if (updatedCluster) {
              setSelectedCluster(updatedCluster);
              localStorage.setItem('selectedClusterId', newId);
            }
          }
        } else {
          // Regular update - refresh the list
          await loadClusters();
        }
      } else {
        throw new Error(response.error || 'Failed to update cluster');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cluster';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCluster = async (clusterId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await clusterApi.removeCluster(clusterId);
      if (response.success) {
        // Remove from local state
        setClusters(prev => prev.filter(c => c.id !== clusterId));
        
        // Clear selection if removed cluster was selected
        if (selectedCluster?.id === clusterId) {
          setSelectedCluster(null);
          localStorage.removeItem('selectedClusterId');
        }
      } else {
        throw new Error(response.error || 'Failed to remove cluster');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove cluster';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectCluster = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      const previousClusterId = selectedCluster?.id || null;
      setSelectedCluster(cluster);
      localStorage.setItem('selectedClusterId', clusterId);
      
      // Emit cluster change event if cluster actually changed
      if (previousClusterId !== clusterId) {
        console.log(`🔄 Cluster changed from ${previousClusterId} to ${clusterId}`);
        clusterEvents.emit(clusterId);
      }
    }
  };

  const connectToCluster = async (clusterId: string) => {
    setError(null);
    
    try {
      const response = await clusterApi.connectToCluster(clusterId);
      if (response.success) {
        // Update cluster connection status
        setClusters(prev => prev.map(c => 
          c.id === clusterId ? { ...c, isConnected: true } : c
        ));
      } else {
        throw new Error(response.error || 'Failed to connect to cluster');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to cluster';
      setError(errorMessage);
      throw err;
    }
  };

  const disconnectFromCluster = async (clusterId: string) => {
    setError(null);
    
    try {
      const response = await clusterApi.disconnectFromCluster(clusterId);
      if (response.success) {
        // Update cluster connection status
        setClusters(prev => prev.map(c => 
          c.id === clusterId ? { ...c, isConnected: false } : c
        ));
      } else {
        throw new Error(response.error || 'Failed to disconnect from cluster');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect from cluster';
      setError(errorMessage);
      throw err;
    }
  };

  const testClusterConnection = async (config: ClusterConfig): Promise<ClusterTestResult> => {
    try {
      const response = await clusterApi.testConnection(config);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const value: ClusterContextType = {
    clusters,
    selectedCluster,
    isLoading,
    error,
    loadClusters,
    addCluster,
    updateCluster,
    removeCluster,
    selectCluster,
    connectToCluster,
    disconnectFromCluster,
    testClusterConnection
  };

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
};
