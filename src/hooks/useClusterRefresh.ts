import { useEffect, useCallback } from 'react';
import { clusterEvents } from '../utils/clusterEvents';

/**
 * Hook that triggers a callback when the selected cluster changes
 * Useful for pages that need to refresh their data when switching clusters
 */
export const useClusterRefresh = (refreshCallback: () => void | Promise<void>) => {
  // Memoize the callback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(refreshCallback, [refreshCallback]);

  useEffect(() => {
    const unsubscribe = clusterEvents.subscribe((clusterId) => {
      console.log(`🔄 Page refreshing data for cluster: ${clusterId}`);
      
      // Execute the refresh callback
      const result = memoizedCallback();
      
      // Handle both sync and async callbacks
      if (result instanceof Promise) {
        result.catch(error => {
          console.error('Error during cluster refresh:', error);
        });
      }
    });

    return unsubscribe;
  }, [memoizedCallback]);
};
