import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Card,
  Text,
  Loader,
  Box,
  Divider,
  List,
  ThemeIcon,
  Group,
  SimpleGrid,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import {
  getNamespaces,
  getPods,
  getServices,
  getDeployments,
} from '../services/k8sService';

interface ResourceCounts {
  pods: number;
  services: number;
  deployments: number;
  running: number;
  pending: number;
  failed: number;
}

const DashboardPage: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [resourceCounts, setResourceCounts] = useState<ResourceCounts>({
    pods: 0,
    services: 0,
    deployments: 0,
    running: 0,
    pending: 0,
    failed: 0,
  });
  const [recentPods, setRecentPods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Fetch resources when namespace changes
  useEffect(() => {
    fetchResources();
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

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch multiple resources in parallel
      const [podsResponse, servicesResponse, deploymentsResponse] =
        await Promise.all([
          getPods(selectedNamespace),
          getServices(selectedNamespace),
          getDeployments(selectedNamespace),
        ]);

      const pods = podsResponse.items || [];
      const services = servicesResponse.items || [];
      const deployments = deploymentsResponse.items || [];

      // Count pod statuses
      const running = pods.filter(
        (pod: any) => pod.status.phase === 'Running'
      ).length;
      const pending = pods.filter(
        (pod: any) => pod.status.phase === 'Pending'
      ).length;
      const failed = pods.filter(
        (pod: any) => pod.status.phase === 'Failed'
      ).length;

      setResourceCounts({
        pods: pods.length,
        services: services.length,
        deployments: deployments.length,
        running,
        pending,
        failed,
      });

      // Sort pods by creation time (most recent first) and take top 5
      const sortedPods = [...pods]
        .sort((a, b) => {
          return (
            new Date(b.metadata.creationTimestamp).getTime() -
            new Date(a.metadata.creationTimestamp).getTime()
          );
        })
        .slice(0, 5);

      setRecentPods(sortedPods);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to fetch resources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
        return (
          <ThemeIcon color="green" variant="light" size="md">
            <span>✓</span>
          </ThemeIcon>
        );
      case 'Pending':
        return (
          <ThemeIcon color="yellow" variant="light" size="md">
            <span>⚠️</span>
          </ThemeIcon>
        );
      case 'Failed':
        return (
          <ThemeIcon color="red" variant="light" size="md">
            <span>✗</span>
          </ThemeIcon>
        );
      default:
        return (
          <ThemeIcon color="blue" variant="light" size="md">
            <span>✓</span>
          </ThemeIcon>
        );
    }
  };

  return (
    <Container size="xl" p="md">
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
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
          <Text color="red">{error}</Text>
        </Paper>
      )}

      <div
        style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}
      >
        {/* Resource Stats - 3 columns */}
        <div>
          <SimpleGrid cols={3}>
            {/* Pods */}
            <Card withBorder shadow="sm" style={{ height: '100%' }}>
              <Card.Section p="md">
                <Group gap="sm">
                  <ThemeIcon color="blue" size="lg">
                    <span>📦</span>
                  </ThemeIcon>
                  <Title order={4}>Pods</Title>
                </Group>
              </Card.Section>
              <Card.Section p="md">
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100px',
                    }}
                  >
                    <Loader size="sm" />
                  </div>
                ) : (
                  <>
                    <Text size="xl" fw={500} ta="center">
                      {resourceCounts.pods}
                    </Text>
                    <Text size="sm" ta="center" c="dimmed">
                      Total Pods
                    </Text>
                    <Divider my="md" />
                    <Group justify="space-between">
                      <Box>
                        <Text size="sm" c="dimmed">
                          Running
                        </Text>
                        <Text c="green" fw={600}>
                          {resourceCounts.running}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed">
                          Pending
                        </Text>
                        <Text c="orange" fw={600}>
                          {resourceCounts.pending}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed">
                          Failed
                        </Text>
                        <Text c="red" fw={600}>
                          {resourceCounts.failed}
                        </Text>
                      </Box>
                    </Group>
                  </>
                )}
              </Card.Section>
            </Card>

            {/* Services */}
            <Card withBorder shadow="sm" style={{ height: '100%' }}>
              <Card.Section p="md">
                <Group gap="sm">
                  <ThemeIcon color="blue" size="lg">
                    <span>⚙️</span>
                  </ThemeIcon>
                  <Title order={4}>Services</Title>
                </Group>
              </Card.Section>
              <Card.Section p="md">
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100px',
                    }}
                  >
                    <Loader size="sm" />
                  </div>
                ) : (
                  <>
                    <Text size="xl" fw={500} ta="center">
                      {resourceCounts.services}
                    </Text>
                    <Text size="sm" ta="center" c="dimmed">
                      Total Services
                    </Text>
                  </>
                )}
              </Card.Section>
            </Card>

            {/* Deployments */}
            <Card withBorder shadow="sm" style={{ height: '100%' }}>
              <Card.Section p="md">
                <Group gap="sm">
                  <ThemeIcon color="blue" size="lg">
                    <span>🔀</span>
                  </ThemeIcon>
                  <Title order={4}>Deployments</Title>
                </Group>
              </Card.Section>
              <Card.Section p="md">
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100px',
                    }}
                  >
                    <Loader size="sm" />
                  </div>
                ) : (
                  <>
                    <Text size="xl" fw={500} ta="center">
                      {resourceCounts.deployments}
                    </Text>
                    <Text size="sm" ta="center" c="dimmed">
                      Total Deployments
                    </Text>
                  </>
                )}
              </Card.Section>
            </Card>
          </SimpleGrid>

          {/* Quick Actions */}
          <Card withBorder shadow="sm" mt="md">
            <Card.Section p="md">
              <Title order={4}>Quick Actions</Title>
            </Card.Section>
            <Card.Section p="md">
              <SimpleGrid cols={3}>
                <Link to="/pods" style={{ textDecoration: 'none' }}>
                  <Paper withBorder p="md">
                    <Group>
                      <ThemeIcon color="blue" size="lg">
                        <span>📦</span>
                      </ThemeIcon>
                      <Text>View All Pods</Text>
                    </Group>
                  </Paper>
                </Link>
                <Link to="/services" style={{ textDecoration: 'none' }}>
                  <Paper withBorder p="md">
                    <Group>
                      <ThemeIcon color="blue" size="lg">
                        <span>⚙️</span>
                      </ThemeIcon>
                      <Text>View All Services</Text>
                    </Group>
                  </Paper>
                </Link>
                <Link to="/deployments" style={{ textDecoration: 'none' }}>
                  <Paper withBorder p="md">
                    <Group>
                      <ThemeIcon color="blue" size="lg">
                        <span>🔀</span>
                      </ThemeIcon>
                      <Text>View All Deployments</Text>
                    </Group>
                  </Paper>
                </Link>
              </SimpleGrid>
            </Card.Section>
          </Card>
        </div>

        {/* Recent Pods - 1 column */}
        <Card withBorder shadow="sm" style={{ height: 'fit-content' }}>
          <Card.Section p="md">
            <Title order={4}>Recent Pods</Title>
          </Card.Section>
          <Card.Section p="md">
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100px',
                }}
              >
                <Loader />
              </div>
            ) : recentPods.length > 0 ? (
              <List spacing="xs">
                {recentPods.map((pod) => (
                  <List.Item
                    key={pod.metadata.uid}
                    icon={getStatusIcon(pod.status.phase)}
                  >
                    <Box>
                      <Text>{pod.metadata.name}</Text>
                      <Text size="xs" c="dimmed">
                        Created:{' '}
                        {new Date(
                          pod.metadata.creationTimestamp
                        ).toLocaleString()}
                      </Text>
                    </Box>
                    <Divider my="xs" />
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text size="sm" ta="center">
                No pods found
              </Text>
            )}
          </Card.Section>
        </Card>
      </div>
    </Container>
  );
};

export default DashboardPage;
