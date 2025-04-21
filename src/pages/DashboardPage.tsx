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
  Progress,
  RingProgress,
  Button,
  Center,
  Alert,
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
  IconCpu,
  IconDeviceDesktopAnalytics,
  IconDatabase,
  IconRefresh,
  IconAlertCircle,
} from '@tabler/icons-react';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import {
  getNamespaces,
  getPods,
  getServices,
  getDeployments,
  getNodeMetrics,
  getNodes,
} from '../services/k8sService';

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

interface NodeMetrics {
  name: string;
  cpu: {
    usage: number;
    capacity: number;
    percentage: number;
  };
  memory: {
    usage: number;
    capacity: number;
    percentage: number;
  };
}

// Helper function to format memory in a human-readable way
const formatMemory = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// Helper function to parse K8s CPU values like "100m" into millicores
const parseCpuValue = (value: string): number => {
  if (value.endsWith('m')) {
    return parseInt(value.slice(0, -1), 10);
  }
  // If not in millicores format, assume it's in cores
  return parseFloat(value) * 1000;
};

// Helper function to parse K8s memory values like "1Gi" into bytes
const parseMemoryValue = (value: string): number => {
  const units: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 * 1024,
    Gi: 1024 * 1024 * 1024,
    Ti: 1024 * 1024 * 1024 * 1024,
    K: 1000,
    M: 1000 * 1000,
    G: 1000 * 1000 * 1000,
    T: 1000 * 1000 * 1000 * 1000,
  };

  // Check for unit suffix
  for (const [suffix, multiplier] of Object.entries(units)) {
    if (value.endsWith(suffix)) {
      return parseFloat(value.slice(0, -suffix.length)) * multiplier;
    }
  }

  // Default to bytes if no suffix
  return parseFloat(value);
};

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
    ready: 0,
    readyPercentage: 0,
  });
  const [recentPods, setRecentPods] = useState<any[]>([]);
  const [clusterMetrics, setClusterMetrics] = useState<NodeMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
    fetchClusterMetrics();
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

  const fetchClusterMetrics = async () => {
    setIsMetricsLoading(true);
    try {
      const result = await getNodeMetrics();
      setNodeMetrics(result.items || []);
      setMetricsError(null);
    } catch (error) {
      console.error('Failed to fetch node metrics', error);
      setMetricsError(
        'Failed to fetch metrics. Please ensure metrics-server is installed.'
      );
    } finally {
      setIsMetricsLoading(false);
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
  };

  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
  };

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

      <Grid gutter="xl" mb="xl">
        {/* Cluster Metrics - kubectl top node style */}
        <Grid.Col span={12}>
          <Card withBorder shadow="sm" radius="md">
            <Card.Section
              p="md"
              style={{
                background: 'linear-gradient(to right, #f0f6ff, #e6f9ff)',
                borderBottom: '1px solid #e6f0fa',
              }}
            >
              <Group justify="apart">
                <Group>
                  <Title order={4}>Node Utilization</Title>
                  <Text size="sm" c="dimmed" style={{ marginLeft: '8px' }}>
                    (kubectl top node)
                  </Text>
                </Group>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconRefresh size="0.9rem" />}
                  onClick={fetchClusterMetrics}
                  loading={isMetricsLoading}
                >
                  Refresh
                </Button>
              </Group>
            </Card.Section>
            <Card.Section p="lg">
              {isMetricsLoading ? (
                <Center p="xl">
                  <Loader />
                </Center>
              ) : metricsError ? (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Metrics Unavailable"
                  color="orange"
                  mt="md"
                >
                  {metricsError}
                  <Button
                    variant="light"
                    size="xs"
                    mt="xs"
                    onClick={() =>
                      window.open(
                        'https://github.com/kubernetes-sigs/metrics-server',
                        '_blank'
                      )
                    }
                  >
                    Install Metrics Server
                  </Button>
                </Alert>
              ) : nodeMetrics.length === 0 ? (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="No Metrics Available"
                  color="blue"
                  mt="md"
                >
                  No metrics data available. Please ensure metrics-server is
                  installed and running in your cluster.
                  <Button
                    variant="light"
                    size="xs"
                    mt="xs"
                    onClick={() =>
                      window.open(
                        'https://github.com/kubernetes-sigs/metrics-server',
                        '_blank'
                      )
                    }
                  >
                    Install Metrics Server
                  </Button>
                </Alert>
              ) : (
                <Box>
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(200px, 1fr) repeat(4, minmax(100px, 1fr))',
                      borderBottom: '1px solid #eee',
                      padding: '0 0 10px 0',
                      marginBottom: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    <Text fw={700} size="sm">
                      NODE
                    </Text>
                    <Text fw={700} size="sm" ta="right">
                      CPU (cores)
                    </Text>
                    <Text fw={700} size="sm" ta="right">
                      CPU%
                    </Text>
                    <Text fw={700} size="sm" ta="right">
                      MEMORY
                    </Text>
                    <Text fw={700} size="sm" ta="right">
                      MEMORY%
                    </Text>
                  </Box>
                  {nodeMetrics.map((node) => (
                    <Box key={node.name} mb="xl">
                      <Box
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'minmax(200px, 1fr) repeat(4, minmax(100px, 1fr))',
                          padding: '8px 0',
                        }}
                      >
                        <Text fw={500} size="sm" truncate>
                          {node.name}
                        </Text>
                        <Text size="sm" ta="right">
                          {(node.cpu.usage / 1000).toFixed(2)}
                        </Text>
                        <Text
                          size="sm"
                          ta="right"
                          c={
                            node.cpu.percentage > 90
                              ? 'red'
                              : node.cpu.percentage > 70
                              ? 'orange'
                              : 'inherit'
                          }
                          fw={node.cpu.percentage > 70 ? 600 : 400}
                        >
                          {Math.round(node.cpu.percentage)}%
                        </Text>
                        <Text size="sm" ta="right">
                          {formatMemory(node.memory.usage)}
                        </Text>
                        <Text
                          size="sm"
                          ta="right"
                          c={
                            node.memory.percentage > 90
                              ? 'red'
                              : node.memory.percentage > 70
                              ? 'orange'
                              : 'inherit'
                          }
                          fw={node.memory.percentage > 70 ? 600 : 400}
                        >
                          {Math.round(node.memory.percentage)}%
                        </Text>
                      </Box>

                      {/* CPU Bar */}
                      <Box mb="sm">
                        <Group justify="space-between" mb={5}>
                          <Text size="xs" c="dimmed">
                            CPU
                          </Text>
                          <Text size="xs" c="dimmed">
                            {(node.cpu.usage / 1000).toFixed(2)} /{' '}
                            {(node.cpu.capacity / 1000).toFixed(2)} cores
                          </Text>
                        </Group>
                        <Progress
                          value={node.cpu.percentage}
                          color={
                            node.cpu.percentage > 90
                              ? 'red'
                              : node.cpu.percentage > 70
                              ? 'orange'
                              : 'blue'
                          }
                          size="md"
                          radius="xs"
                          striped={node.cpu.percentage > 80}
                          animated={node.cpu.percentage > 80}
                        />
                      </Box>

                      {/* Memory Bar */}
                      <Box>
                        <Group justify="space-between" mb={5}>
                          <Text size="xs" c="dimmed">
                            Memory
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatMemory(node.memory.usage)} /{' '}
                            {formatMemory(node.memory.capacity)}
                          </Text>
                        </Group>
                        <Progress
                          value={node.memory.percentage}
                          color={
                            node.memory.percentage > 90
                              ? 'red'
                              : node.memory.percentage > 70
                              ? 'orange'
                              : 'green'
                          }
                          size="md"
                          radius="xs"
                          striped={node.memory.percentage > 80}
                          animated={node.memory.percentage > 80}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Card.Section>
          </Card>
        </Grid.Col>

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
