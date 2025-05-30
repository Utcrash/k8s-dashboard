import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, LoadingOverlay, Text } from '@mantine/core';
import PodList from '../components/Pods/PodList';
import { getPods, updatePod, restartPod } from '../services/k8sService';
import { useNamespace } from '../context/NamespaceContext';
import { showNotification } from '@mantine/notifications';

const PodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { globalNamespace } = useNamespace();

  const [pods, setPods] = useState<any[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState(globalNamespace);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the namespace when the global namespace changes
  useEffect(() => {
    setSelectedNamespace(globalNamespace);
  }, [globalNamespace]);

  // Fetch pods when selected namespace changes
  useEffect(() => {
    fetchPods();
  }, [selectedNamespace]);

  const fetchPods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPods(selectedNamespace);
      setPods(response.items || []);
    } catch (err) {
      console.error('Error fetching pods:', err);
      setError('Failed to fetch pods');
      setPods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePodSelect = (pod: any) => {
    // Navigate to the pod detail page using the new URL structure
    navigate(`/pods/${pod.metadata.namespace}/${pod.metadata.name}`);
  };

  const updateAndRestartPod = async (podName: string, podYaml: any) => {
    try {
      // First update the pod with new YAML
      await updatePod(podName, selectedNamespace, podYaml);

      // Then restart it
      await restartPod(podName, selectedNamespace);

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
