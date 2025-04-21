import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Title,
  Box,
  LoadingOverlay,
  Text,
} from '@mantine/core';
import PodList from '../components/Pods/PodList';
import PodDetail from '../components/Pods/PodDetail';
import { getPods } from '../services/k8sService';
import { useNamespace } from '../context/NamespaceContext';

const PodsPage: React.FC = () => {
  const { globalNamespace, useGlobalNamespace } = useNamespace();

  const [pods, setPods] = useState<any[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState(globalNamespace);
  const [selectedPod, setSelectedPod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update selected namespace when global namespace changes if using global
  useEffect(() => {
    if (useGlobalNamespace) {
      setSelectedNamespace(globalNamespace);
    }
  }, [globalNamespace, useGlobalNamespace]);

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
      setSelectedPod(null); // Clear selected pod when namespace changes
    } catch (err) {
      console.error('Error fetching pods:', err);
      setError('Failed to fetch pods');
      setPods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePodSelect = (pod: any) => {
    setSelectedPod(pod);
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
        {selectedPod ? (
          <>
            <Grid.Col span={12}>
              <PodDetail pod={selectedPod} namespace={selectedNamespace} />
            </Grid.Col>
          </>
        ) : (
          <Grid.Col span={12}>
            <PodList
              pods={pods}
              onPodSelect={handlePodSelect}
              onRefresh={fetchPods}
              isLoading={isLoading}
            />
          </Grid.Col>
        )}
      </Grid>
    </Container>
  );
};

export default PodsPage;
