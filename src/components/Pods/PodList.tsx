import React, { useState } from 'react';
import {
  Table,
  Paper,
  Title,
  Button,
  Badge,
  TextInput,
  Box,
  Group,
  ActionIcon,
  Menu,
  rem,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconRefresh,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconReload,
  IconEye,
} from '@tabler/icons-react';
import {
  getPod,
  updatePod,
  deletePod,
  restartPod,
} from '../../services/k8sService';
import YamlEditor from '../Common/YamlEditor';
import ConfirmationModal from '../Common/ConfirmationModal';

interface PodListProps {
  pods: any[];
  onPodSelect: (pod: any) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const PodList: React.FC<PodListProps> = ({
  pods,
  onPodSelect,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPodForAction, setSelectedPodForAction] = useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [
    restartModalOpen,
    { open: openRestartModal, close: closeRestartModal },
  ] = useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [podYaml, setPodYaml] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Running':
        return (
          <Badge color="green" variant="filled" size="sm">
            {status}
          </Badge>
        );
      case 'Pending':
        return (
          <Badge color="yellow" variant="filled" size="sm">
            {status}
          </Badge>
        );
      case 'Failed':
        return (
          <Badge color="red" variant="filled" size="sm">
            {status}
          </Badge>
        );
      case 'Succeeded':
        return (
          <Badge color="blue" variant="filled" size="sm">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="filled" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredPods = pods.filter(
    (pod) =>
      pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.metadata.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.status.phase.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditYaml = async (pod: any) => {
    try {
      setSelectedPodForAction(pod);
      setActionLoading(true);

      // Fetch the latest pod definition
      const podData = await getPod(pod.metadata.name, pod.metadata.namespace);
      setPodYaml(podData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching pod data:', error);
      // Handle error (could add a notification here)
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartPod = async () => {
    if (!selectedPodForAction) return;

    try {
      setActionLoading(true);
      await restartPod(
        selectedPodForAction.metadata.name,
        selectedPodForAction.metadata.namespace
      );
      onRefresh();
      closeRestartModal();
    } catch (error) {
      console.error('Error restarting pod:', error);
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePod = async () => {
    if (!selectedPodForAction) return;

    try {
      setActionLoading(true);
      await deletePod(
        selectedPodForAction.metadata.name,
        selectedPodForAction.metadata.namespace
      );
      onRefresh();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting pod:', error);
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedPodForAction) return;

    await updatePod(
      selectedPodForAction.metadata.name,
      selectedPodForAction.metadata.namespace,
      updatedYaml
    );

    // Refresh the pod list after successful update
    onRefresh();
  };

  return (
    <Box>
      <Box
        mb="md"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title order={3}>Pods</Title>
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={onRefresh}
          loading={isLoading}
          size="sm"
        >
          Refresh
        </Button>
      </Box>

      <TextInput
        placeholder="Search pods..."
        size="sm"
        value={searchTerm}
        onChange={handleSearch}
        leftSection={<IconSearch size="1rem" />}
        mb="md"
        style={{ maxWidth: 400 }}
      />

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Namespace</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Ready</Table.Th>
              <Table.Th>Restarts</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPods.length > 0 ? (
              filteredPods.map((pod) => {
                const readyContainers = pod.status.containerStatuses
                  ? pod.status.containerStatuses.filter(
                      (status: any) => status.ready
                    ).length
                  : 0;
                const totalContainers = pod.status.containerStatuses
                  ? pod.status.containerStatuses.length
                  : 0;
                const restarts = pod.status.containerStatuses
                  ? pod.status.containerStatuses.reduce(
                      (sum: number, container: any) =>
                        sum + container.restartCount,
                      0
                    )
                  : 0;

                // Calculate age
                const creationTime = new Date(
                  pod.metadata.creationTimestamp
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

                return (
                  <Table.Tr key={pod.metadata.uid}>
                    <Table.Td>{pod.metadata.name}</Table.Td>
                    <Table.Td>{pod.metadata.namespace}</Table.Td>
                    <Table.Td>{getStatusBadge(pod.status.phase)}</Table.Td>
                    <Table.Td>{age}</Table.Td>
                    <Table.Td>{`${readyContainers}/${totalContainers}`}</Table.Td>
                    <Table.Td>{restarts}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="View Details">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => onPodSelect(pod)}
                          >
                            <IconEye size="1rem" />
                          </ActionIcon>
                        </Tooltip>

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
                              onClick={() => handleEditYaml(pod)}
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
                                setSelectedPodForAction(pod);
                                openRestartModal();
                              }}
                              disabled={pod.status.phase !== 'Running'}
                            >
                              Restart Pod
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
                                setSelectedPodForAction(pod);
                                openDeleteModal();
                              }}
                            >
                              Delete Pod
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
                  {isLoading ? 'Loading pods...' : 'No pods found'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && selectedPodForAction && podYaml && (
        <YamlEditor
          yaml={podYaml}
          onSave={handleSaveYaml}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={`Edit Pod: ${selectedPodForAction.metadata.name}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePod}
        title="Delete Pod"
        message={`Are you sure you want to delete pod "${selectedPodForAction?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete Pod"
        isLoading={actionLoading}
      />

      {/* Restart Confirmation Modal */}
      <ConfirmationModal
        isOpen={restartModalOpen}
        onClose={closeRestartModal}
        onConfirm={handleRestartPod}
        title="Restart Pod"
        message={`Are you sure you want to restart pod "${selectedPodForAction?.metadata.name}"?`}
        confirmText="Restart Pod"
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default PodList;
