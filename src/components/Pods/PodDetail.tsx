import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useCurrentNamespace } from '../../hooks/useNamespace';

interface PodDetailProps {
  pod: any;
  namespace: string;
}

const PodDetail: React.FC<PodDetailProps> = ({ pod, namespace: podNamespace }) => {
  const navigate = useNavigate();
  const { namespace } = useCurrentNamespace();
  const { tab = 'details' } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState(tab);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tailLines, setTailLines] = useState(1000);
  const [logTimeframe, setLogTimeframe] = useState<number | undefined>(
    undefined
  );

  // Reference to store the cancel function for streaming
  const streamingCancelRef = useRef<(() => void) | null>(null);

  const containers = pod?.spec?.containers || [];

  // Update the active tab when the URL parameter changes
  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

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

  const processLogData = (logsData: any): string[] => {
    try {
      // Handle array of logs
      if (Array.isArray(logsData)) {
        return logsData.map(log => typeof log === 'string' ? log : JSON.stringify(log, null, 2));
      }
      
      // Handle string logs
      if (typeof logsData === 'string') {
        // Try to parse as JSON first (in case it's a JSON string)
        try {
          const parsed = JSON.parse(logsData);
          if (typeof parsed === 'object') {
            return [JSON.stringify(parsed, null, 2)];
          }
        } catch {
          // Not JSON, treat as regular string
        }
        
        // Split by lines and filter empty lines
        const logLines = logsData.split('\n').filter(line => line.trim() !== '');
        return logLines.length > 0 ? logLines : [logsData];
      }
      
      // Handle object logs (complex structured data)
      if (typeof logsData === 'object' && logsData !== null) {
        // Check if it's a response object with data property
        if (logsData.success && logsData.data) {
          return processLogData(logsData.data);
        }
        
        // Check if it has a raw property (common in API responses)
        if (logsData.raw) {
          return processLogData(logsData.raw);
        }
        
        // If it's a complex object, try to format it nicely
        if (logsData.data && typeof logsData.data === 'object') {
          const formatted = JSON.stringify(logsData.data, null, 2);
          return formatted.split('\n');
        }
        
        // Fallback: stringify the entire object
        const formatted = JSON.stringify(logsData, null, 2);
        return formatted.split('\n');
      }
      
      // Fallback for any other type
      return [String(logsData)];
    } catch (error) {
      console.error('Error processing log data:', error);
      return [`Error processing logs: ${error instanceof Error ? error.message : 'Unknown error'}`];
    }
  };

  const fetchLogs = async () => {
    if (!pod?.metadata?.name || !selectedContainer) return;

    setIsLoading(true);
    try {
      const logsData: any = await getPodLogs(
        pod.metadata.name,
        namespace,
        selectedContainer,
        tailLines,
        false // logTimeframe should be boolean for follow parameter
      );

      const processedLogs = processLogData(logsData);
      setLogs(processedLogs);
      
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setLogs([`Error fetching logs: ${error.message || 'Unknown error'}`]);
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
      selectedContainer,
      (logChunk: string) => {
        // Process the log chunk before adding it
        const processedChunk = processLogData(logChunk);
        setLogs((prev) => [...prev, ...processedChunk]);
      },
      (error: Error) => {
        console.error('Streaming error:', error);
        setLogs((prev) => [...prev, `Error: ${error.message}`]);
        setIsStreaming(false);
      }
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
          <Select
            label="Lines"
            placeholder="Number of lines"
            value={tailLines.toString()}
            onChange={(value) => {
              setTailLines(parseInt(value || '1000', 10));
            }}
            data={[
              { value: '100', label: '100 lines' },
              { value: '500', label: '500 lines' },
              { value: '1000', label: '1000 lines' },
              { value: '5000', label: '5000 lines' },
            ]}
            style={{ width: 140 }}
            size="sm"
          />
          <Select
            label="Time Range"
            placeholder="All logs"
            value={logTimeframe?.toString() || ''}
            onChange={(value) => {
              setLogTimeframe(value ? parseInt(value, 10) : undefined);
            }}
            data={[
              { value: '', label: 'All logs' },
              { value: '300', label: 'Last 5 minutes' },
              { value: '900', label: 'Last 15 minutes' },
              { value: '3600', label: 'Last hour' },
              { value: '86400', label: 'Last 24 hours' },
            ]}
            style={{ width: 160 }}
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

  const handleTabChange = (value: string | null) => {
    // Cancel streaming when switching tabs
    if (isStreaming && value !== 'logs') {
      cancelStreaming();
      setIsStreaming(false);
    }

    // Update the URL when changing tabs
    if (value) {
      setActiveTab(value);
      navigate(`/${namespace}/pods/${namespace}/${pod.metadata.name}/${value}`);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Tabs value={activeTab} onChange={handleTabChange}>
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
