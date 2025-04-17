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
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import { getPods, getNamespaces } from '../services/k8sService';

const PodsPage: React.FC = () => {
  const [pods, setPods] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [selectedPod, setSelectedPod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Fetch pods when selected namespace changes
  useEffect(() => {
    fetchPods();
  }, [selectedNamespace]);

  const fetchNamespaces = async () => {
    try {
      const response = await getNamespaces();
      const namespaceNames = response.items.map((ns: any) => ns.metadata.name);
      setNamespaces(namespaceNames);
    } catch (err) {
      console.error('Error fetching namespaces:', err);
      setError('Failed to fetch namespaces');
    }
  };

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

  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
  };

  const handlePodSelect = (pod: any) => {
    setSelectedPod(pod);
  };

  return (
    <Container size="xl" p="md" pos="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <Box
        mb="md"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title order={2}>Kubernetes Dashboard</Title>
        <NamespaceSelector
          namespaces={namespaces}
          selectedNamespace={selectedNamespace}
          onNamespaceChange={handleNamespaceChange}
        />
      </Box>

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
