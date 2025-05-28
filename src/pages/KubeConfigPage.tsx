import React, { useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Alert,
  Card,
  Flex,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconServer,
} from '@tabler/icons-react';
import { useKubeConfig } from '../context/KubeConfigContext';

const KubeConfigPage: React.FC = () => {
  const {
    configs,
    activeConfig,
    addConfig,
    removeConfig,
    setActiveConfig,
    isLoading,
    error,
  } = useKubeConfig();
  const [opened, { open, close }] = useDisclosure(false);
  const [configName, setConfigName] = useState('');
  const [configContent, setConfigContent] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddConfig = async () => {
    if (!configName.trim() || !configContent.trim()) {
      setAddError('Please provide both name and config content');
      return;
    }

    try {
      await addConfig(configName.trim(), configContent.trim());
      notifications.show({
        title: 'Success',
        message: 'Kubeconfig added successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setConfigName('');
      setConfigContent('');
      setAddError(null);
      close();
    } catch (err: any) {
      setAddError(err.message);
    }
  };

  const handleRemoveConfig = (id: string, name: string) => {
    removeConfig(id);
    notifications.show({
      title: 'Removed',
      message: `Configuration "${name}" removed`,
      color: 'blue',
    });
  };

  const handleSetActive = (id: string, name: string) => {
    setActiveConfig(id);
    notifications.show({
      title: 'Switched',
      message: `Now using "${name}" configuration`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Kubernetes Configurations</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Add Configuration
          </Button>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        <Text size="sm" c="dimmed">
          Manage your Kubernetes cluster configurations. You can add kubeconfig
          files from different clusters and switch between them without needing
          to run kubectl proxy on each server.
        </Text>

        <Stack gap="md">
          {configs.map((config) => (
            <Card
              key={config.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <Group justify="space-between" mb="xs">
                <Group>
                  <IconServer size={20} />
                  <Text fw={500}>{config.name}</Text>
                  {config.isDefault && (
                    <Badge color="blue" variant="light" size="sm">
                      Default
                    </Badge>
                  )}
                  {activeConfig?.id === config.id && (
                    <Badge color="green" variant="light" size="sm">
                      Active
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
                  {activeConfig?.id !== config.id && (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleSetActive(config.id, config.name)}
                    >
                      Use This Config
                    </Button>
                  )}
                  {!config.isDefault && (
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleRemoveConfig(config.id, config.name)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>

              <Text size="sm" c="dimmed">
                Server: {config.server}
              </Text>

              {config.config && (
                <Text size="sm" c="dimmed" mt="xs">
                  Context: {config.config['current-context']}
                </Text>
              )}
            </Card>
          ))}
        </Stack>

        {configs.length === 0 && (
          <Paper p="xl" ta="center">
            <Text c="dimmed">
              No configurations available. Add your first kubeconfig to get
              started.
            </Text>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Add Kubernetes Configuration"
        size="lg"
      >
        <Stack gap="md">
          {addError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {addError}
            </Alert>
          )}

          <TextInput
            label="Configuration Name"
            placeholder="e.g., Production Cluster, Development Cluster"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            required
          />

          <Textarea
            label="Kubeconfig Content"
            placeholder="Paste your kubeconfig YAML content here..."
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            minRows={10}
            maxRows={20}
            required
          />

          <Text size="xs" c="dimmed">
            Paste the contents of your kubeconfig file (usually found at
            ~/.kube/config). Make sure it includes the cluster, context, and
            user information.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleAddConfig} loading={isLoading}>
              Add Configuration
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default KubeConfigPage;
