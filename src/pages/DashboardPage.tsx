import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Progress,
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
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useGlobalNamespace } from '../hooks/useGlobalNamespace';
import { useClusterRefresh } from '../hooks/useClusterRefresh';
import {
  getNamespaces,
  getPods,
  getServices,
  getDeployments,
} from '../services/k8sService';

// Get the default namespace from environment variables
const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'default';

interface ResourceCounts {
  pods: number;
  services: number;
  deployments: number;
  running: number;
  pending: number;
  failed: number;
  ready: number;
  readyPercentage: number;
}


const DashboardPage: React.FC = () => {
  const { globalNamespace } = useGlobalNamespace();
  const [namespaces, setNamespaces] = useState<string[]>([DEFAULT_NAMESPACE]);
  const [resourceCounts, setResourceCounts] = useState<ResourceCounts>({
    pods: 0,
    services: 0,
    deployments: 0,
    running: 0,
    pending: 0,
    failed: 0,
    ready: 0,
    readyPercentage: 0,
  });
  const [recentPods, setRecentPods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNamespaces = useCallback(async () => {
    try {
      const response = await getNamespaces();
      const namespaceNames = response.items.map((ns: any) => ns.metadata.name);
      setNamespaces(namespaceNames);
    } catch (err) {
      console.error('Error fetching namespaces:', err);
      setError('Failed to fetch namespaces');
    }
  }, []);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch multiple resources in parallel
      const [podsResponse, servicesResponse, deploymentsResponse] =
        await Promise.all([
          getPods(globalNamespace),
          getServices(globalNamespace),
          getDeployments(globalNamespace),
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

      // Count ready pods
      let readyPods = 0;
      pods.forEach((pod: any) => {
        if (pod.status.containerStatuses) {
          const allContainersReady = pod.status.containerStatuses.every(
            (container: any) => container.ready
          );
          if (allContainersReady) {
            readyPods++;
          }
        }
      });

      const readyPercentage =
        pods.length > 0 ? Math.round((readyPods / pods.length) * 100) : 0;

      setResourceCounts({
        pods: pods.length,
        services: services.length,
        deployments: deployments.length,
        running,
        pending,
        failed,
        ready: readyPods,
        readyPercentage,
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
  }, [globalNamespace]);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  // Fetch resources when namespace changes
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Refresh dashboard when cluster changes
  useClusterRefresh(() => {
    fetchNamespaces();
    fetchResources();
  });

  const isPodReady = (pod: any): boolean => {
    if (!pod.status.containerStatuses) return false;
    return pod.status.containerStatuses.every(
      (container: any) => container.ready
    );
  };

  // Get the detailed pod status including container states
  const getPodDetailedStatus = (pod: any): string => {
    // If pod is being deleted
    if (pod.metadata.deletionTimestamp) {
      return 'Terminating';
    }

    // Check for container statuses
    if (pod.status.containerStatuses) {
      for (const container of pod.status.containerStatuses) {
        // Check for waiting containers
        if (container.state?.waiting?.reason) {
          return container.state.waiting.reason;
        }

        // Check for terminated containers with non-zero exit code
        if (
          container.state?.terminated?.reason &&
          container.state.terminated.exitCode !== 0
        ) {
          return container.state.terminated.reason;
        }
      }
    }

    // Check for init container statuses
    if (pod.status.initContainerStatuses) {
      for (const container of pod.status.initContainerStatuses) {
        if (container.state?.waiting?.reason) {
          return `Init:${container.state.waiting.reason}`;
        }
        if (
          container.state?.terminated?.reason &&
          container.state.terminated.exitCode !== 0
        ) {
          return `Init:${container.state.terminated.reason}`;
        }
      }
    }

    // Default to the phase
    return pod.status.phase;
  };

  const getStatusIcon = (status: string, pod: any) => {
    const ready = isPodReady(pod);
    const detailedStatus = getPodDetailedStatus(pod);

    if (status === 'Running' && ready) {
      return (
        <ThemeIcon color="green" variant="light" size="md">
          <IconCheck size="1rem" />
        </ThemeIcon>
      );
    } else if (detailedStatus === 'Terminating') {
      return (
        <ThemeIcon color="indigo" variant="light" size="md">
          <IconAlertTriangle size="1rem" />
        </ThemeIcon>
      );
    } else if (
      detailedStatus.includes('Error') ||
      detailedStatus.includes('CrashLoopBackOff') ||
      detailedStatus.includes('ImagePull')
    ) {
      return (
        <ThemeIcon color="red" variant="light" size="md">
          <IconAlertTriangle size="1rem" />
        </ThemeIcon>
      );
    } else if (status === 'Running' && !ready) {
      return (
        <ThemeIcon color="orange" variant="light" size="md">
          <IconAlertTriangle size="1rem" />
        </ThemeIcon>
      );
    } else if (status === 'Pending') {
      return (
        <ThemeIcon color="yellow" variant="light" size="md">
          <IconAlertTriangle size="1rem" />
        </ThemeIcon>
      );
    } else if (status === 'Failed') {
      return (
        <ThemeIcon color="red" variant="light" size="md">
          <IconAlertTriangle size="1rem" />
        </ThemeIcon>
      );
    } else {
      return (
        <ThemeIcon color="blue" variant="light" size="md">
          <IconCheck size="1rem" />
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
          <Text fw={500} size="md">
            Namespace:{' '}
            <Text span fw={700} c="blue">
              {globalNamespace}
            </Text>
          </Text>
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

      <Grid gutter="xl" mb="xl">
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

                    {/* Ready Pods Progress */}
                    <Box mb="md">
                      <Group justify="apart" mb={5}>
                        <Text size="sm" fw={500}>
                          Ready Status
                        </Text>
                        <Text
                          size="sm"
                          fw={700}
                          c={
                            resourceCounts.readyPercentage === 100
                              ? 'green'
                              : 'orange'
                          }
                        >
                          {resourceCounts.ready} / {resourceCounts.pods}
                        </Text>
                      </Group>
                      <Progress
                        value={resourceCounts.readyPercentage}
                        color={
                          resourceCounts.readyPercentage === 100
                            ? 'green'
                            : resourceCounts.readyPercentage > 50
                            ? 'blue'
                            : 'orange'
                        }
                        size="md"
                        radius="xl"
                        striped={resourceCounts.readyPercentage < 100}
                        animated={resourceCounts.readyPercentage < 100}
                      />
                    </Box>

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
                <Link to={`/${globalNamespace}/pods`} style={{ textDecoration: 'none' }}>
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
                <Link to={`/${globalNamespace}/services`} style={{ textDecoration: 'none' }}>
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
                <Link to={`/${globalNamespace}/deployments`} style={{ textDecoration: 'none' }}>
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
                      icon={getStatusIcon(pod.status.phase, pod)}
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
                            {pod.status.containerStatuses && (
                              <Text
                                size="xs"
                                c={isPodReady(pod) ? 'green' : 'orange'}
                              >
                                Ready:{' '}
                                {
                                  pod.status.containerStatuses.filter(
                                    (c: any) => c.ready
                                  ).length
                                }
                                /{pod.status.containerStatuses.length}
                              </Text>
                            )}
                          </div>
                          <Badge
                            color={
                              isPodReady(pod) && pod.status.phase === 'Running'
                                ? 'green'
                                : pod.status.phase === 'Running'
                                ? 'orange'
                                : pod.status.phase === 'Pending'
                                ? 'yellow'
                                : 'red'
                            }
                            variant="light"
                          >
                            {isPodReady(pod) && pod.status.phase === 'Running'
                              ? 'Ready'
                              : getPodDetailedStatus(pod)}
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
