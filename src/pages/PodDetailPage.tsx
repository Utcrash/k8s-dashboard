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

const PodDetailPage: React.FC = () => {
  const {
    namespace,
    name,
    tab = 'details',
  } = useParams<{ namespace: string; name: string; tab?: string }>();
  const navigate = useNavigate();
  const [pod, setPod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPodData();
  }, [namespace, name]);

  const fetchPodData = async () => {
    if (!namespace || !name) return;

    setIsLoading(true);
    setError(null);

    try {
      const podData = await getPod(name, namespace);
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
    navigate('/pods');
  };

  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs mb="md">
        <Anchor onClick={() => navigate('/')}>Dashboard</Anchor>
        <Anchor onClick={() => navigate('/pods')}>Pods</Anchor>
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
        <PodDetail pod={pod} namespace={namespace || 'default'} />
      ) : (
        <Paper p="md" withBorder>
          Pod not found
        </Paper>
      )}
    </Container>
  );
};

export default PodDetailPage;
