import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Box,
  Table,
  Paper,
  Button,
  TextInput,
  LoadingOverlay,
  Text,
  Group,
  ActionIcon,
  Menu,
  rem,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import {
  getConfigMaps,
  getNamespaces,
  getConfigMap,
  updateConfigMap,
  deleteConfigMap,
} from '../services/k8sService';
import YamlEditor from '../components/Common/YamlEditor';
import ConfirmationModal from '../components/Common/ConfirmationModal';

const ConfigMapsPage: React.FC = () => {
  const [configMaps, setConfigMaps] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [selectedConfigMap, setSelectedConfigMap] = useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [configMapYaml, setConfigMapYaml] = useState<any>(null);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Fetch configMaps when selected namespace changes
  useEffect(() => {
    fetchConfigMaps();
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

  const fetchConfigMaps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getConfigMaps(selectedNamespace);
      setConfigMaps(response.items || []);
    } catch (err) {
      console.error('Error fetching configMaps:', err);
      setError('Failed to fetch configMaps');
      setConfigMaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredConfigMaps = configMaps.filter((configMap) =>
    configMap.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit YAML functionality
  const handleEditYaml = async (configMap: any) => {
    try {
      setSelectedConfigMap(configMap);
      setActionLoading(true);

      // Fetch the latest configMap definition
      const configMapData = await getConfigMap(
        configMap.metadata.name,
        configMap.metadata.namespace
      );
      setConfigMapYaml(configMapData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching configMap data:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete configMap functionality
  const handleDeleteConfigMap = async () => {
    if (!selectedConfigMap) return;

    try {
      setActionLoading(true);
      await deleteConfigMap(
        selectedConfigMap.metadata.name,
        selectedConfigMap.metadata.namespace
      );
      fetchConfigMaps(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting configMap:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Save YAML changes
  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedConfigMap) return;

    try {
      setActionLoading(true);
      await updateConfigMap(
        selectedConfigMap.metadata.name,
        selectedConfigMap.metadata.namespace,
        updatedYaml
      );
      // Refresh the configMap list after successful update
      fetchConfigMaps();
      closeYamlEditor();
    } catch (error) {
      console.error('Error updating configMap:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container size="xl" p="md" pos="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <Box
        mb="xl"
        mt="lg"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title order={2}>ConfigMaps</Title>
        <NamespaceSelector
          namespaces={namespaces}
          selectedNamespace={selectedNamespace}
          onNamespaceChange={handleNamespaceChange}
        />
      </Box>

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
          placeholder="Search configMaps..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchConfigMaps}
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
              <Table.Th>Data</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredConfigMaps.length > 0 ? (
              filteredConfigMaps.map((configMap) => {
                // Calculate age
                const creationTime = new Date(
                  configMap.metadata.creationTimestamp
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

                const dataCount = configMap.data
                  ? Object.keys(configMap.data).length
                  : 0;

                return (
                  <Table.Tr key={configMap.metadata.uid}>
                    <Table.Td>{configMap.metadata.name}</Table.Td>
                    <Table.Td>{dataCount} items</Table.Td>
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
                              onClick={() => handleEditYaml(configMap)}
                            >
                              Edit YAML
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
                                setSelectedConfigMap(configMap);
                                openDeleteModal();
                              }}
                            >
                              Delete ConfigMap
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
                <Table.Td colSpan={4} align="center">
                  No configMaps found in the selected namespace
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && selectedConfigMap && configMapYaml && (
        <YamlEditor
          yaml={configMapYaml}
          onSave={handleSaveYaml}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={`Edit ConfigMap: ${selectedConfigMap.metadata.name}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfigMap}
        title="Delete ConfigMap"
        message={`Are you sure you want to delete configMap "${selectedConfigMap?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete ConfigMap"
        isLoading={actionLoading}
      />
    </Container>
  );
};

export default ConfigMapsPage;
