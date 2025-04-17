import React, { useState, useEffect } from 'react';
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
import { getPodLogs } from '../../services/k8sService';

interface PodDetailProps {
  pod: any;
  namespace: string;
}

const PodDetail: React.FC<PodDetailProps> = ({ pod, namespace }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containers = pod?.spec?.containers || [];

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name);
    }
  }, [containers, selectedContainer]);

  useEffect(() => {
    if (activeTab === 'logs' && selectedContainer) {
      fetchLogs();
    }
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
            onChange={(value) => value && setSelectedContainer(value)}
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
          >
            Refresh
          </Button>
        </Group>
        <LogViewer logs={logs} refreshLogs={fetchLogs} isLoading={isLoading} />
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
        onChange={(value) => value && setActiveTab(value)}
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
