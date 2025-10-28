import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Loader,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import PodDetail from '../components/Pods/PodDetail';
import { getPod } from '../services/k8sService';
import { useGlobalNamespace } from '../hooks/useGlobalNamespace';

// Get the default namespace from environment variables
const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'default';

const PodDetailPage: React.FC = () => {
  const {
    namespace: routeNamespace,
    podNamespace,
    name,
    tab = 'details',
  } = useParams<{ namespace: string; podNamespace: string; name: string; tab?: string }>();
  const navigate = useNavigate();
  const { globalNamespace } = useGlobalNamespace();
  const [pod, setPod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use podNamespace from route params (the actual namespace of the pod)
  const namespace = podNamespace || DEFAULT_NAMESPACE;

  useEffect(() => {
    fetchPodData();
  }, [podNamespace, name]);

  const fetchPodData = async () => {
    if (!podNamespace || !name) return;

    setIsLoading(true);
    setError(null);

    try {
      const podData = await getPod(name, podNamespace);
      setPod(podData);
    } catch (err: any) {
      console.error('Error fetching pod:', err);
      setError(
        `Failed to fetch pod details: ${err.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/${globalNamespace}/pods`);
  };

  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs mb="md">
        <Anchor onClick={() => navigate(`/${globalNamespace}/dashboard`)}>Dashboard</Anchor>
        <Anchor onClick={() => navigate(`/${globalNamespace}/pods`)}>Pods</Anchor>
        <span>{name}</span>
      </Breadcrumbs>
    );
  };

  return (
    <Container size="xl" p="md">
      {renderBreadcrumbs()}

      <Group mb="md" justify="space-between">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size="1rem" />}
          onClick={handleBack}
        >
          Back to Pods
        </Button>
        <Title order={3}>{name}</Title>
      </Group>

      {isLoading ? (
        <Paper
          p="xl"
          withBorder
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Loader />
        </Paper>
      ) : error ? (
        <Paper
          p="md"
          withBorder
          style={{
            backgroundColor: '#ffebee',
            borderLeft: '4px solid #f44336',
          }}
        >
          {error}
        </Paper>
      ) : pod ? (
        <PodDetail pod={pod} namespace={namespace || DEFAULT_NAMESPACE} />
      ) : (
        <Paper p="md" withBorder>
          Pod not found
        </Paper>
      )}
    </Container>
  );
};

export default PodDetailPage;
