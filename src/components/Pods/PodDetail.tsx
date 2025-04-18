import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Title,
  Grid,
  Tabs,
  Button,
  Select,
  Box,
  Loader,
  Text,
  Stack,
  Group,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import LogViewer from '../Logs/LogViewer';
import { getPodLogs, streamPodLogs } from '../../services/k8sService';

interface PodDetailProps {
  pod: any;
  namespace: string;
}

const PodDetail: React.FC<PodDetailProps> = ({ pod, namespace }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Reference to store the cancel function for streaming
  const streamingCancelRef = useRef<(() => void) | null>(null);

  const containers = pod?.spec?.containers || [];

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name);
    }
  }, [containers, selectedContainer]);

  useEffect(() => {
    if (activeTab === 'logs' && selectedContainer) {
      // If not streaming, fetch logs regularly
      if (!isStreaming) {
        fetchLogs();
      }
    }
  }, [activeTab, selectedContainer, isStreaming]);

  // Cleanup streaming on unmount or when switching tabs/containers
  useEffect(() => {
    return () => {
      cancelStreaming();
    };
  }, [activeTab, selectedContainer]);

  const fetchLogs = async () => {
    if (!pod?.metadata?.name || !selectedContainer) return;

    setIsLoading(true);
    try {
      const logsData = await getPodLogs(
        pod.metadata.name,
        namespace,
        selectedContainer
      );
      // Split logs by newline and remove empty lines
      setLogs(logsData.split('\n').filter(Boolean));
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs(['Error fetching logs. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = () => {
    if (!pod?.metadata?.name || !selectedContainer) return;

    // Cancel any existing stream first
    cancelStreaming();

    // Clear logs before starting streaming
    setLogs([]);

    // Start the new stream
    const cancelStream = streamPodLogs(
      pod.metadata.name,
      namespace,
      (logChunk: string) => {
        // Add new log chunk to the logs array
        setLogs((prev) => [...prev, logChunk]);
      },
      (error: Error) => {
        console.error('Streaming error:', error);
        setLogs((prev) => [...prev, `Error: ${error.message}`]);
        setIsStreaming(false);
      },
      selectedContainer
    );

    // Store cancel function
    streamingCancelRef.current = cancelStream;
  };

  const cancelStreaming = () => {
    if (streamingCancelRef.current) {
      streamingCancelRef.current();
      streamingCancelRef.current = null;
    }
  };

  const handleStreamingToggle = (enabled: boolean) => {
    setIsStreaming(enabled);

    if (enabled) {
      startStreaming();
    } else {
      cancelStreaming();
      // Fetch logs once when disabling streaming
      fetchLogs();
    }
  };

  const renderDetails = () => {
    return (
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={5} mb="md">
            Pod Info
          </Title>
          <Stack>
            <Box>
              <Text fw={600} size="sm">
                Name:
              </Text>
              <Text size="sm">{pod.metadata.name}</Text>
            </Box>
            <Box>
              <Text fw={600} size="sm">
                Namespace:
              </Text>
              <Text size="sm">{pod.metadata.namespace}</Text>
            </Box>
            <Box>
              <Text fw={600} size="sm">
                Created:
              </Text>
              <Text size="sm">
                {new Date(pod.metadata.creationTimestamp).toLocaleString()}
              </Text>
            </Box>
            <Box>
              <Text fw={600} size="sm">
                Status:
              </Text>
              <Text size="sm">{pod.status.phase}</Text>
            </Box>
            <Box>
              <Text fw={600} size="sm">
                Node:
              </Text>
              <Text size="sm">{pod.spec?.nodeName || 'Unknown'}</Text>
            </Box>
            <Box>
              <Text fw={600} size="sm">
                IP:
              </Text>
              <Text size="sm">{pod.status?.podIP || 'Not assigned'}</Text>
            </Box>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={5} mb="md">
            Containers
          </Title>
          <Stack>
            {containers.map((container: any, index: number) => (
              <Box key={index}>
                <Text fw={600} size="sm">
                  Name:
                </Text>
                <Text size="sm">{container.name}</Text>
                <Text fw={600} size="sm">
                  Image:
                </Text>
                <Text size="sm">{container.image}</Text>
              </Box>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    );
  };

  const renderLogs = () => {
    return (
      <>
        <Group mb="md" align="flex-end">
          <Select
            label="Container"
            placeholder="Select container"
            value={selectedContainer}
            onChange={(value) => {
              // Cancel streaming if active
              if (isStreaming) {
                cancelStreaming();
                setIsStreaming(false);
              }

              if (value) {
                setSelectedContainer(value);
              }
            }}
            data={containers.map((container: any) => ({
              value: container.name,
              label: container.name,
            }))}
            style={{ minWidth: 200 }}
            size="sm"
          />
          <Button
            variant="outline"
            leftSection={<IconRefresh size="1rem" />}
            onClick={fetchLogs}
            loading={isLoading}
            size="sm"
            disabled={isStreaming}
          >
            Refresh
          </Button>
        </Group>
        <LogViewer
          logs={logs}
          refreshLogs={fetchLogs}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStreamingToggle={handleStreamingToggle}
        />
      </>
    );
  };

  if (!pod) {
    return <Text>No pod data available</Text>;
  }

  return (
    <Paper p="md" withBorder>
      <Box mb="md">
        <Title order={3}>{pod.metadata.name}</Title>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(value) => {
          // Cancel streaming when switching tabs
          if (isStreaming && value !== 'logs') {
            cancelStreaming();
            setIsStreaming(false);
          }

          if (value) {
            setActiveTab(value);
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="logs">Logs</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          {renderDetails()}
        </Tabs.Panel>
        <Tabs.Panel value="logs" pt="md">
          {renderLogs()}
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default PodDetail;
