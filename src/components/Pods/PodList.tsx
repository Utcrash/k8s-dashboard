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
  Text,
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
  IconCheck,
  IconX,
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

  const getStatusBadge = (status: string, pod: any) => {
    const ready = isPodReady(pod);
    const detailedStatus = getPodDetailedStatus(pod);

    // Choose color based on the status
    let color = 'gray';
    if (detailedStatus === 'Running' && ready) {
      color = 'green';
    } else if (detailedStatus === 'Running' && !ready) {
      color = 'orange';
    } else if (detailedStatus === 'Pending') {
      color = 'yellow';
    } else if (detailedStatus === 'Terminating') {
      color = 'indigo';
    } else if (
      detailedStatus.includes('Error') ||
      detailedStatus === 'Failed' ||
      detailedStatus.includes('CrashLoopBackOff') ||
      detailedStatus.includes('ImagePull')
    ) {
      color = 'red';
    } else if (detailedStatus === 'Succeeded') {
      color = 'blue';
    }

    // Display text based on detailed status
    let text = detailedStatus;
    if (detailedStatus === 'Running' && ready) {
      text = 'Ready';
    } else if (detailedStatus === 'Running' && !ready) {
      text = 'Not Ready';
    }

    return (
      <Badge color={color} variant="filled" size="sm">
        {text}
      </Badge>
    );
  };

  const getReadinessBadge = (pod: any) => {
    if (
      !pod.status.containerStatuses ||
      pod.status.containerStatuses.length === 0
    ) {
      return <Text size="sm">N/A</Text>;
    }

    const readyCount = pod.status.containerStatuses.filter(
      (c: any) => c.ready
    ).length;
    const totalCount = pod.status.containerStatuses.length;
    const allReady = readyCount === totalCount;

    return (
      <Group gap="xs" wrap="nowrap">
        <Badge
          color={allReady ? 'green' : 'orange'}
          variant="light"
          leftSection={allReady ? <IconCheck size={10} /> : <IconX size={10} />}
        >
          {readyCount}/{totalCount}
        </Badge>
      </Group>
    );
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredPods = pods.filter(
    (pod) =>
      pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.metadata.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.status.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.spec?.nodeName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (pod.status?.podIP || '').includes(searchTerm)
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
        placeholder="Search pods by name, namespace, status, node, or IP..."
        size="sm"
        value={searchTerm}
        onChange={handleSearch}
        leftSection={<IconSearch size="1rem" />}
        mb="md"
        style={{ maxWidth: 500 }}
      />

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Namespace</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>IP</Table.Th>
              <Table.Th>Node</Table.Th>
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
                const ageInMilliseconds = now - creationTime;
                const days = Math.floor(
                  ageInMilliseconds / (1000 * 60 * 60 * 24)
                );
                const hours = Math.floor(
                  (ageInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                const minutes = Math.floor(
                  (ageInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
                );

                const ageString =
                  days > 0
                    ? `${days}d${hours}h`
                    : hours > 0
                    ? `${hours}h${minutes}m`
                    : `${minutes}m`;

                // Get node name and pod IP
                const nodeName = pod.spec?.nodeName || '<none>';
                const podIP = pod.status?.podIP || '<none>';
                const nominatedNodeName = pod.status?.nominatedNodeName || '';

                return (
                  <Table.Tr
                    key={pod.metadata.uid}
                    onClick={() => onPodSelect(pod)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>{pod.metadata.name}</Table.Td>
                    <Table.Td>{pod.metadata.namespace}</Table.Td>
                    <Table.Td>{getStatusBadge(pod.status.phase, pod)}</Table.Td>
                    <Table.Td>{podIP}</Table.Td>
                    <Table.Td>
                      {nodeName !== '<none>' ? (
                        <Tooltip
                          label={
                            nominatedNodeName
                              ? `Nominated: ${nominatedNodeName}`
                              : undefined
                          }
                        >
                          <Badge color="gray" variant="light" size="sm">
                            {nodeName}
                          </Badge>
                        </Tooltip>
                      ) : (
                        '<none>'
                      )}
                    </Table.Td>
                    <Table.Td>{ageString}</Table.Td>
                    <Table.Td>{getReadinessBadge(pod)}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={restarts > 0 ? 'red' : 'gray'}
                        variant="filled"
                        size="sm"
                      >
                        {restarts}
                      </Badge>
                    </Table.Td>
                    <Table.Td
                      onClick={(e) => {
                        // Prevent row click from triggering
                        e.stopPropagation();
                      }}
                    >
                      <Menu withinPortal position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPodSelect(pod);
                            }}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditYaml(pod);
                            }}
                            disabled={actionLoading}
                          >
                            Edit YAML
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconReload size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPodForAction(pod);
                              openRestartModal();
                            }}
                            disabled={actionLoading}
                          >
                            Restart Pod
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPodForAction(pod);
                              openDeleteModal();
                            }}
                            disabled={actionLoading}
                            color="red"
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={9} align="center">
                  {isLoading ? 'Loading pods...' : 'No pods found'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && (
        <YamlEditor
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          yaml={podYaml}
          onSave={handleSaveYaml}
          title="Edit Pod YAML"
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePod}
        title="Delete Pod"
        message={`Are you sure you want to delete the pod "${selectedPodForAction?.metadata?.name}"?`}
        confirmText="Delete"
        isLoading={actionLoading}
      />

      {/* Restart Confirmation Modal */}
      <ConfirmationModal
        isOpen={restartModalOpen}
        onClose={closeRestartModal}
        onConfirm={handleRestartPod}
        title="Restart Pod"
        message={`Are you sure you want to restart the pod "${selectedPodForAction?.metadata?.name}"?`}
        confirmText="Restart"
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default PodList;
