import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, LoadingOverlay, Text } from '@mantine/core';
import PodList from '../components/Pods/PodList';
import { getPods, updatePod, restartPod } from '../services/k8sService';
import { useCurrentNamespace } from '../hooks/useNamespace';
import { useClusterRefresh } from '../hooks/useClusterRefresh';
import { showNotification } from '@mantine/notifications';

const PodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { namespace } = useCurrentNamespace();

  const [pods, setPods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPods(namespace);
      setPods(response.items || []);
    } catch (err) {
      console.error('Error fetching pods:', err);
      setError('Failed to fetch pods');
      setPods([]);
    } finally {
      setIsLoading(false);
    }
  }, [namespace]);

  // Fetch pods when namespace changes
  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  // Refresh pods when cluster changes
  useClusterRefresh(fetchPods);

  const handlePodSelect = (pod: any) => {
    // Navigate to the pod detail page using the new URL structure
    navigate(`/${namespace}/pods/${pod.metadata.namespace}/${pod.metadata.name}`);
  };

  const updateAndRestartPod = async (podName: string, podYaml: any) => {
    try {
      // First update the pod with new YAML
      await updatePod(podName, namespace, podYaml);

      // Then restart it
      await restartPod(podName, namespace);

      // Refresh the pod list
      await fetchPods();

      // Show success notification
      showNotification({
        title: 'Success',
        message: 'Pod updated and restarted successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating/restarting pod:', error);
      // Show error notification
      showNotification({
        title: 'Error',
        message: 'Failed to update or restart pod',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" p="md" mt="md" pos="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      {error && (
        <Paper
          p="md"
          mb="md"
          style={{
            backgroundColor: '#ffebee',
          }}
        >
          <Text c="red">{error}</Text>
        </Paper>
      )}

      <Grid>
        <Grid.Col span={12}>
          <PodList
            pods={pods}
            onPodSelect={handlePodSelect}
            onRefresh={fetchPods}
            isLoading={isLoading}
            updateAndRestartPod={updateAndRestartPod}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default PodsPage;
