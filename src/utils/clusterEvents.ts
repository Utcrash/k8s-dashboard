// Simple event emitter for cluster change events
class ClusterEventEmitter {
  private listeners: Array<(clusterId: string | null) => void> = [];

  subscribe(callback: (clusterId: string | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit(clusterId: string | null) {
    this.listeners.forEach(callback => {
      try {
        callback(clusterId);
      } catch (error) {
        console.error('Error in cluster change listener:', error);
      }
    });
  }
}

export const clusterEvents = new ClusterEventEmitter();
