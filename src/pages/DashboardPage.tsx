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
  Flex,
  Grid,
  Transition,
  Space,
  Avatar,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconDashboard,
  IconBox,
  IconServer,
  IconNetwork,
  IconApps,
  IconFiles,
  IconUserShield,
} from '@tabler/icons-react';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import TokenInput from '../components/TokenInput';
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
      <Paper p="md" withBorder radius="md" shadow="sm" mb="xl">
        <Group justify="space-between" wrap="nowrap">
          <Flex direction="column" gap="xs">
            <Title order={2} fw={700} style={{ fontSize: '1.8rem' }}>
              Kubernetes Dashboard
            </Title>
            <Text size="sm" c="dimmed">
              Manage your Kubernetes resources
            </Text>
          </Flex>
          <NamespaceSelector
            namespaces={namespaces}
            selectedNamespace={selectedNamespace}
            onNamespaceChange={handleNamespaceChange}
          />
        </Group>
      </Paper>

      {error && (
        <Paper
          p="md"
          mb="xl"
          radius="md"
          style={{
            backgroundColor: '#ffebee',
            borderLeft: '4px solid #f44336',
          }}
        >
          <Text c="red" fw={500}>
            {error}
          </Text>
        </Paper>
      )}

      <Paper
        p="md"
        mb="xl"
        radius="md"
        withBorder
        shadow="sm"
        style={{ background: 'linear-gradient(to right, #f7fafc, #edf2f7)' }}
      >
        <TokenInput />
      </Paper>

      <Grid gutter="xl">
        {/* Resource Stats */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {/* Pods */}
            <Card withBorder shadow="sm" radius="md" p={0}>
              <Card.Section
                p="md"
                style={{
                  background: 'linear-gradient(to right, #e6f7ff, #f0f9ff)',
                  borderBottom: '1px solid #e6f0fa',
                }}
              >
                <Group gap="sm">
                  <ThemeIcon color="blue" size="lg" radius="md" variant="light">
                    <IconBox size="1.3rem" stroke={1.5} />
                  </ThemeIcon>
                  <Title order={4}>Pods</Title>
                </Group>
              </Card.Section>
              <Card.Section p="lg">
                {isLoading ? (
                  <Flex justify="center" align="center" h={100}>
                    <Loader size="sm" />
                  </Flex>
                ) : (
                  <>
                    <Text size="2rem" fw={700} ta="center" mb="xs">
                      {resourceCounts.pods}
                    </Text>
                    <Text size="sm" ta="center" c="dimmed" mb="lg">
                      Total Pods
                    </Text>
                    <Divider my="md" />
                    <Group justify="space-between">
                      <Flex direction="column" align="center">
                        <Badge
                          color="green"
                          size="lg"
                          variant="light"
                          radius="sm"
                          mb="xs"
                        >
                          {resourceCounts.running}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Running
                        </Text>
                      </Flex>
                      <Flex direction="column" align="center">
                        <Badge
                          color="yellow"
                          size="lg"
                          variant="light"
                          radius="sm"
                          mb="xs"
                        >
                          {resourceCounts.pending}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Pending
                        </Text>
                      </Flex>
                      <Flex direction="column" align="center">
                        <Badge
                          color="red"
                          size="lg"
                          variant="light"
                          radius="sm"
                          mb="xs"
                        >
                          {resourceCounts.failed}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Failed
                        </Text>
                      </Flex>
                    </Group>
                  </>
                )}
              </Card.Section>
            </Card>

            {/* Services */}
            <Card withBorder shadow="sm" radius="md" p={0}>
              <Card.Section
                p="md"
                style={{
                  background: 'linear-gradient(to right, #fff3e6, #fff8f0)',
                  borderBottom: '1px solid #f7ede2',
                }}
              >
                <Group gap="sm">
                  <ThemeIcon
                    color="orange"
                    size="lg"
                    radius="md"
                    variant="light"
                  >
                    <IconNetwork size="1.3rem" stroke={1.5} />
                  </ThemeIcon>
                  <Title order={4}>Services</Title>
                </Group>
              </Card.Section>
              <Card.Section p="lg">
                {isLoading ? (
                  <Flex justify="center" align="center" h={100}>
                    <Loader size="sm" />
                  </Flex>
                ) : (
                  <>
                    <Text size="2rem" fw={700} ta="center" mb="xs">
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
            <Card withBorder shadow="sm" radius="md" p={0}>
              <Card.Section
                p="md"
                style={{
                  background: 'linear-gradient(to right, #e6f2ff, #f0f6ff)',
                  borderBottom: '1px solid #e6ecfa',
                }}
              >
                <Group gap="sm">
                  <ThemeIcon
                    color="indigo"
                    size="lg"
                    radius="md"
                    variant="light"
                  >
                    <IconApps size="1.3rem" stroke={1.5} />
                  </ThemeIcon>
                  <Title order={4}>Deployments</Title>
                </Group>
              </Card.Section>
              <Card.Section p="lg">
                {isLoading ? (
                  <Flex justify="center" align="center" h={100}>
                    <Loader size="sm" />
                  </Flex>
                ) : (
                  <>
                    <Text size="2rem" fw={700} ta="center" mb="xs">
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
          <Card withBorder shadow="sm" mt="xl" radius="md">
            <Card.Section
              p="md"
              style={{
                background: 'linear-gradient(to right, #f8f9fa, #f1f3f5)',
              }}
            >
              <Group justify="apart">
                <Title order={4}>Quick Actions</Title>
                <Text size="sm" c="dimmed">
                  Navigate to resources
                </Text>
              </Group>
            </Card.Section>
            <Card.Section p="lg">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Link to="/pods" style={{ textDecoration: 'none' }}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    shadow="xs"
                    style={{
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      ':hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Group>
                      <ThemeIcon color="blue" size="lg" radius="md">
                        <IconBox size="1.3rem" stroke={1.5} />
                      </ThemeIcon>
                      <Text fw={500}>View All Pods</Text>
                    </Group>
                  </Paper>
                </Link>
                <Link to="/services" style={{ textDecoration: 'none' }}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    shadow="xs"
                    style={{
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      ':hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Group>
                      <ThemeIcon color="orange" size="lg" radius="md">
                        <IconNetwork size="1.3rem" stroke={1.5} />
                      </ThemeIcon>
                      <Text fw={500}>View All Services</Text>
                    </Group>
                  </Paper>
                </Link>
                <Link to="/deployments" style={{ textDecoration: 'none' }}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    shadow="xs"
                    style={{
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      ':hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Group>
                      <ThemeIcon color="indigo" size="lg" radius="md">
                        <IconApps size="1.3rem" stroke={1.5} />
                      </ThemeIcon>
                      <Text fw={500}>View All Deployments</Text>
                    </Group>
                  </Paper>
                </Link>
              </SimpleGrid>
            </Card.Section>
          </Card>
        </Grid.Col>

        {/* Recent Pods column */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" radius="md" h="100%">
            <Card.Section
              p="md"
              style={{
                background: 'linear-gradient(to right, #f5f7fa, #eef2f7)',
              }}
            >
              <Group justify="apart">
                <Title order={4}>Recent Pods</Title>
                <Badge color="blue" variant="light">
                  Last 5
                </Badge>
              </Group>
            </Card.Section>
            <Card.Section p="md">
              {isLoading ? (
                <Flex justify="center" align="center" h={200}>
                  <Loader />
                </Flex>
              ) : recentPods.length > 0 ? (
                <List spacing="md" center>
                  {recentPods.map((pod) => (
                    <List.Item
                      key={pod.metadata.uid}
                      icon={getStatusIcon(pod.status.phase)}
                    >
                      <Paper withBorder radius="md" p="xs" w="100%">
                        <Group justify="apart" wrap="nowrap">
                          <div>
                            <Text fw={500} size="sm" lineClamp={1}>
                              {pod.metadata.name}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              Created:{' '}
                              {new Date(
                                pod.metadata.creationTimestamp
                              ).toLocaleString()}
                            </Text>
                          </div>
                          <Badge
                            color={
                              pod.status.phase === 'Running'
                                ? 'green'
                                : pod.status.phase === 'Pending'
                                ? 'yellow'
                                : 'red'
                            }
                            variant="light"
                          >
                            {pod.status.phase}
                          </Badge>
                        </Group>
                      </Paper>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Flex justify="center" align="center" h={200}>
                  <Text size="sm" c="dimmed">
                    No pods found
                  </Text>
                </Flex>
              )}
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
