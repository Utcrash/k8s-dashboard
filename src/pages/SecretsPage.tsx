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
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  rem,
  Modal,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconKey,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  getSecrets,
  getSecret,
  createSecret,
  updateSecret,
  deleteSecret,
} from '../services/k8sService';
import YamlEditor from '../components/Common/YamlEditor';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { useGlobalNamespace } from '../hooks/useGlobalNamespace';

const SecretsPage: React.FC = () => {
  const { globalNamespace } = useGlobalNamespace();

  const [secrets, setSecrets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecretData, setShowSecretData] = useState<Record<string, boolean>>(
    {}
  );

  // Action state
  const [selectedSecret, setSelectedSecret] = useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [
    secretDetailOpen,
    { open: openSecretDetail, close: closeSecretDetail },
  ] = useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [secretYaml, setSecretYaml] = useState<any>(null);

  // Fetch secrets when global namespace changes
  useEffect(() => {
    fetchSecrets();
  }, [globalNamespace]);

  const fetchSecrets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSecrets(globalNamespace);
      setSecrets(response.items || []);
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setError('Failed to fetch secrets');
      setSecrets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredSecrets = secrets.filter((secret) =>
    secret.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit YAML functionality
  const handleEditYaml = async (secret: any) => {
    try {
      setSelectedSecret(secret);
      setActionLoading(true);

      // Fetch the latest secret definition
      const secretData = await getSecret(secret.metadata.name, globalNamespace);
      setSecretYaml(secretData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching secret data:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete secret functionality
  const handleDeleteSecret = async () => {
    if (!selectedSecret) return;

    try {
      setActionLoading(true);
      await deleteSecret(selectedSecret.metadata.name, globalNamespace);
      fetchSecrets(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting secret:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // View secret details
  const handleViewSecret = async (secret: any) => {
    setSelectedSecret(secret);
    openSecretDetail();
  };

  // Save YAML changes
  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedSecret) return;

    try {
      setActionLoading(true);
      await updateSecret(
        selectedSecret.metadata.name,
        globalNamespace,
        updatedYaml
      );
      // Refresh the secret list after successful update
      fetchSecrets();
      closeYamlEditor();
    } catch (error) {
      console.error('Error updating secret:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle visibility of a secret value
  const toggleSecretVisibility = (secretName: string) => {
    setShowSecretData((prev) => ({
      ...prev,
      [secretName]: !prev[secretName],
    }));
  };

  // Decode base64 encoded secret
  const decodeBase64 = (data: string): string => {
    try {
      return atob(data);
    } catch (e) {
      return 'Invalid base64 data';
    }
  };

  // Create an empty secret template for new secrets
  const createEmptySecret = () => {
    const newSecret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'new-secret',
        namespace: globalNamespace,
      },
      type: 'Opaque',
      data: {
        'example-key': btoa('example-value'),
      },
    };

    setSecretYaml(newSecret);
    setSelectedSecret(null); // No existing secret selected
    openYamlEditor();
  };

  // Handle creating a new secret
  const handleCreateSecret = async (newSecretYaml: any) => {
    try {
      setActionLoading(true);
      // Extract name from YAML or generate one
      const secretName = newSecretYaml?.metadata?.name || `secret-${Date.now()}`;
      await createSecret(secretName, globalNamespace, newSecretYaml);
      fetchSecrets();
      closeYamlEditor();
    } catch (error) {
      console.error('Error creating secret:', error);
    } finally {
      setActionLoading(false);
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

      <Box mb="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Secrets</Title>
          <Text>
            Namespace:{' '}
            <Badge size="md" color="blue">
              {globalNamespace}
            </Badge>
          </Text>
        </Group>
      </Box>

      <Box
        display="flex"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <TextInput
          placeholder="Search secrets..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Group>
          <Button
            variant="filled"
            color="green"
            leftSection={<IconPlus size="1rem" />}
            onClick={createEmptySecret}
            size="sm"
          >
            Create Secret
          </Button>
          <Button
            variant="outline"
            leftSection={<IconRefresh size="1rem" />}
            onClick={fetchSecrets}
            loading={isLoading}
            size="sm"
          >
            Refresh
          </Button>
        </Group>
      </Box>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Data</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredSecrets.length > 0 ? (
              filteredSecrets.map((secret) => {
                // Calculate age
                const creationTime = new Date(
                  secret.metadata.creationTimestamp
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

                // Count the number of data entries
                const dataCount = secret.data
                  ? Object.keys(secret.data).length
                  : 0;

                return (
                  <Table.Tr key={secret.metadata.uid}>
                    <Table.Td>{secret.metadata.name}</Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">
                        {secret.type || 'Opaque'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="gray">
                        {dataCount} item{dataCount !== 1 ? 's' : ''}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{age}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="View Secret Data">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleViewSecret(secret)}
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
                              onClick={() => handleEditYaml(secret)}
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
                                setSelectedSecret(secret);
                                openDeleteModal();
                              }}
                            >
                              Delete Secret
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
                <Table.Td colSpan={5} align="center">
                  {isLoading
                    ? 'Loading secrets...'
                    : 'No secrets found in this namespace'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && secretYaml && (
        <YamlEditor
          yaml={secretYaml}
          onSave={selectedSecret ? handleSaveYaml : handleCreateSecret}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={
            selectedSecret
              ? `Edit Secret: ${selectedSecret.metadata.name}`
              : 'Create New Secret'
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteSecret}
        title="Delete Secret"
        message={`Are you sure you want to delete secret "${selectedSecret?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete Secret"
        isLoading={actionLoading}
      />

      {/* Secret Details Modal */}
      <Modal
        opened={secretDetailOpen}
        onClose={closeSecretDetail}
        title={
          selectedSecret
            ? `Secret: ${selectedSecret.metadata.name}`
            : 'Secret Details'
        }
        size="lg"
      >
        {selectedSecret && (
          <Box>
            <Group mb="md">
              <Text fw={700}>Type:</Text>
              <Badge color="blue">{selectedSecret.type || 'Opaque'}</Badge>
            </Group>

            <Text fw={700} mb="xs">
              Data:
            </Text>
            {selectedSecret.data &&
            Object.keys(selectedSecret.data).length > 0 ? (
              Object.entries(selectedSecret.data).map(
                ([key, value]: [string, any]) => (
                  <Paper key={key} p="xs" withBorder mb="xs">
                    <Group justify="apart" mb="xs">
                      <Group>
                        <IconKey size="1rem" />
                        <Text fw={600}>{key}</Text>
                      </Group>
                      <ActionIcon
                        onClick={() => toggleSecretVisibility(key)}
                        variant="subtle"
                      >
                        {showSecretData[key] ? (
                          <IconEyeOff size="1rem" />
                        ) : (
                          <IconEye size="1rem" />
                        )}
                      </ActionIcon>
                    </Group>
                    {showSecretData[key] ? (
                      <Text style={{ wordBreak: 'break-all' }}>
                        {decodeBase64(value as string)}
                      </Text>
                    ) : (
                      <Text>********</Text>
                    )}
                  </Paper>
                )
              )
            ) : (
              <Text c="dimmed">No data available in this secret</Text>
            )}
          </Box>
        )}
      </Modal>
    </Container>
  );
};

export default SecretsPage;
