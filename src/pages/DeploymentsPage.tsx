import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Box,
  Table,
  Paper,
  Button,
  TextInput,
  LoadingOverlay,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  rem,
  Tooltip,
  Checkbox,
  NumberInput,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconReload,
  IconPlus,
  IconMinus,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals, openContextModal } from '@mantine/modals';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import { useClusterRefresh } from '../hooks/useClusterRefresh';
import {
  getDeployments,
  getNamespaces,
  getDeployment,
  updateDeployment,
  deleteDeployment,
  restartDeployment,
  scaleDeployment,
} from '../services/k8sService';
import YamlEditor from '../components/Common/YamlEditor';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { useCurrentNamespace } from '../hooks/useNamespace';
import { notifications } from '@mantine/notifications';

const DeploymentsPage: React.FC = () => {
  const { namespace } = useCurrentNamespace();

  const [deployments, setDeployments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [
    restartModalOpen,
    { open: openRestartModal, close: closeRestartModal },
  ] = useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deploymentYaml, setDeploymentYaml] = useState<any>(null);

  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDeployments(namespace);
      setDeployments(response.items || []);
    } catch (err) {
      console.error('Error fetching deployments:', err);
      setError('Failed to fetch deployments');
      setDeployments([]);
    } finally {
      setIsLoading(false);
    }
  }, [namespace]);

  // Fetch deployments when namespace changes
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Refresh deployments when cluster changes
  useClusterRefresh(fetchDeployments);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredDeployments = deployments.filter((deployment) =>
    deployment.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit YAML functionality
  const handleEditYaml = async (deployment: any) => {
    try {
      setSelectedDeployment(deployment);
      setActionLoading(true);

      // Fetch the latest deployment definition
      const deploymentData = await getDeployment(
        deployment.metadata.name,
        deployment.metadata.namespace
      );
      setDeploymentYaml(deploymentData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching deployment data:', error);
      // Handle error (could add a notification here)
    } finally {
      setActionLoading(false);
    }
  };

  // Restart deployment functionality
  const handleRestartDeployment = async () => {
    if (!selectedDeployment) return;

    try {
      setActionLoading(true);
      await restartDeployment(
        selectedDeployment.metadata.name,
        selectedDeployment.metadata.namespace
      );
      fetchDeployments(); // Refresh the list
      closeRestartModal();
    } catch (error) {
      console.error('Error restarting deployment:', error);
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  // Delete deployment functionality
  const handleDeleteDeployment = async () => {
    if (!selectedDeployment) return;

    try {
      setActionLoading(true);
      await deleteDeployment(
        selectedDeployment.metadata.name,
        selectedDeployment.metadata.namespace
      );
      fetchDeployments(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting deployment:', error);
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  // Save YAML changes
  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedDeployment) return;

    await updateDeployment(
      selectedDeployment.metadata.name,
      selectedDeployment.metadata.namespace,
      updatedYaml
    );

    // Refresh the deployment list after successful update
    fetchDeployments();
  };

  // Add a function to handle scaling deployments
  const handleScaleDeployment = async (
    name: string,
    namespace: string,
    currentReplicas: number,
    newReplicas: number
  ) => {
    if (currentReplicas === newReplicas) return; // No change

    try {
      setIsLoading(true);
      await scaleDeployment(name, namespace, newReplicas);

      // Show success notification
      notifications.show({
        title: 'Deployment Scaled',
        message: `${name} scaled to ${newReplicas} replicas`,
        color: 'green',
      });

      // Refresh the deployments list
      fetchDeployments();
    } catch (error) {
      console.error('Error scaling deployment:', error);

      // Show error notification
      notifications.show({
        title: 'Scaling Failed',
        message: `Failed to scale ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xl" p="md" mt="md" pos="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      {error && (
        <Paper
          p="md"
          mb="md"
          style={{
            backgroundColor: '#ffebee',
          }}
        >
          <Text c="red">{error}</Text>
        </Paper>
      )}

      <Box
        display="flex"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <TextInput
          placeholder="Search deployments..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchDeployments}
          loading={isLoading}
          size="sm"
        >
          Refresh
        </Button>
      </Box>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Namespace</Table.Th>
              <Table.Th>Ready</Table.Th>
              <Table.Th>Up-to-date</Table.Th>
              <Table.Th>Available</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredDeployments.length > 0 ? (
              filteredDeployments.map((deployment) => {
                // Calculate age
                const creationTime = new Date(
                  deployment.metadata.creationTimestamp
                ).getTime();
                const now = new Date().getTime();
                const ageInSeconds = (now - creationTime) / 1000;

                let age = '';
                if (ageInSeconds < 60) {
                  age = `${Math.floor(ageInSeconds)}s`;
                } else if (ageInSeconds < 3600) {
                  age = `${Math.floor(ageInSeconds / 60)}m`;
                } else if (ageInSeconds < 86400) {
                  age = `${Math.floor(ageInSeconds / 3600)}h`;
                } else {
                  age = `${Math.floor(ageInSeconds / 86400)}d`;
                }

                // Get status
                const status = deployment.status || {};
                const readyReplicas = status.readyReplicas || 0;
                const desiredReplicas = status.replicas || 0;
                const updatedReplicas = status.updatedReplicas || 0;
                const availableReplicas = status.availableReplicas || 0;

                return (
                  <Table.Tr key={deployment.metadata.uid}>
                    <Table.Td>{deployment.metadata.name}</Table.Td>
                    <Table.Td>{deployment.metadata.namespace}</Table.Td>
                    <Table.Td>
                      <Group gap={5}>
                        <Text size="sm">{`${readyReplicas}/${desiredReplicas}`}</Text>
                        <Tooltip label="Scale deployment">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => {
                              openContextModal({
                                modal: 'scaleDeployment',
                                title: `Scale Deployment: ${deployment.metadata.name}`,
                                innerProps: {
                                  deploymentName: deployment.metadata.name,
                                  namespace: deployment.metadata.namespace,
                                  currentReplicas: desiredReplicas,
                                  onScale: handleScaleDeployment,
                                },
                              });
                            }}
                          >
                            <IconAdjustmentsHorizontal size="1rem" />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                    <Table.Td>{updatedReplicas}</Table.Td>
                    <Table.Td>{availableReplicas}</Table.Td>
                    <Table.Td>{age}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Menu position="bottom-end" withArrow shadow="md">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDotsVertical size="1rem" />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={
                                <IconEdit
                                  style={{ width: rem(14), height: rem(14) }}
                                />
                              }
                              onClick={() => handleEditYaml(deployment)}
                            >
                              Edit YAML
                            </Menu.Item>

                            <Menu.Item
                              leftSection={
                                <IconReload
                                  style={{ width: rem(14), height: rem(14) }}
                                />
                              }
                              onClick={() => {
                                setSelectedDeployment(deployment);
                                openRestartModal();
                              }}
                            >
                              Restart Deployment
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item
                              color="red"
                              leftSection={
                                <IconTrash
                                  style={{ width: rem(14), height: rem(14) }}
                                />
                              }
                              onClick={() => {
                                setSelectedDeployment(deployment);
                                openDeleteModal();
                              }}
                            >
                              Delete Deployment
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} align="center">
                  {isLoading
                    ? 'Loading deployments...'
                    : 'No deployments found in this namespace'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && selectedDeployment && deploymentYaml && (
        <YamlEditor
          yaml={deploymentYaml}
          onSave={handleSaveYaml}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={`Edit Deployment: ${selectedDeployment.metadata.name}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteDeployment}
        title="Delete Deployment"
        message={`Are you sure you want to delete deployment "${selectedDeployment?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete Deployment"
        isLoading={actionLoading}
      />

      {/* Restart Confirmation Modal */}
      <ConfirmationModal
        isOpen={restartModalOpen}
        onClose={closeRestartModal}
        onConfirm={handleRestartDeployment}
        title="Restart Deployment"
        message={`Are you sure you want to restart deployment "${selectedDeployment?.metadata.name}"? This will perform a rolling restart of all pods.`}
        confirmText="Restart Deployment"
        isLoading={actionLoading}
      />
    </Container>
  );
};

export default DeploymentsPage;
