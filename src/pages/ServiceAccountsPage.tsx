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
  Tooltip,
  Checkbox,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import {
  getServiceAccounts,
  getNamespaces,
  getServiceAccount,
  updateServiceAccount,
  deleteServiceAccount,
} from '../services/k8sService';
import YamlEditor from '../components/Common/YamlEditor';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { useNamespace } from '../context/NamespaceContext';

const ServiceAccountsPage: React.FC = () => {
  const { globalNamespace } = useNamespace();
  const [selectedNamespace, setSelectedNamespace] = useState(globalNamespace);
  const [serviceAccounts, setServiceAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [selectedServiceAccount, setSelectedServiceAccount] =
    useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceAccountYaml, setServiceAccountYaml] = useState<any>(null);

  // Update the namespace when the global namespace changes
  useEffect(() => {
    setSelectedNamespace(globalNamespace);
  }, [globalNamespace]);

  // Fetch serviceAccounts when selected namespace changes
  useEffect(() => {
    fetchServiceAccounts();
  }, [selectedNamespace]);

  const fetchServiceAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getServiceAccounts(selectedNamespace);
      setServiceAccounts(response.items || []);
    } catch (err) {
      console.error('Error fetching serviceAccounts:', err);
      setError('Failed to fetch service accounts');
      setServiceAccounts([]);
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

  const filteredServiceAccounts = serviceAccounts.filter((serviceAccount) =>
    serviceAccount.metadata.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Edit YAML functionality
  const handleEditYaml = async (serviceAccount: any) => {
    try {
      setSelectedServiceAccount(serviceAccount);
      setActionLoading(true);

      // Fetch the latest serviceAccount definition
      const serviceAccountData = await getServiceAccount(
        serviceAccount.metadata.name,
        serviceAccount.metadata.namespace
      );
      setServiceAccountYaml(serviceAccountData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching serviceAccount data:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete serviceAccount functionality
  const handleDeleteServiceAccount = async () => {
    if (!selectedServiceAccount) return;

    try {
      setActionLoading(true);
      await deleteServiceAccount(
        selectedServiceAccount.metadata.name,
        selectedServiceAccount.metadata.namespace
      );
      fetchServiceAccounts(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting serviceAccount:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Save YAML changes
  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedServiceAccount) return;

    try {
      setActionLoading(true);
      await updateServiceAccount(
        selectedServiceAccount.metadata.name,
        selectedServiceAccount.metadata.namespace,
        updatedYaml
      );
      // Refresh the serviceAccount list after successful update
      fetchServiceAccounts();
      closeYamlEditor();
    } catch (error) {
      console.error('Error updating serviceAccount:', error);
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

      <Box
        mb="md"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title order={2}>Service Accounts</Title>
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
          placeholder="Search Service Accounts..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchServiceAccounts}
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
              <Table.Th>Secrets</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredServiceAccounts.length > 0 ? (
              filteredServiceAccounts.map((serviceAccount) => {
                // Calculate age
                const creationTime = new Date(
                  serviceAccount.metadata.creationTimestamp
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

                // Get secrets
                const secrets = serviceAccount.secrets || [];

                return (
                  <Table.Tr key={serviceAccount.metadata.uid}>
                    <Table.Td>{serviceAccount.metadata.name}</Table.Td>
                    <Table.Td>{serviceAccount.metadata.namespace}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {secrets.length > 0 ? (
                          secrets.map((secret: any, index: number) => (
                            <Badge key={index} variant="outline" size="xs">
                              {secret.name}
                            </Badge>
                          ))
                        ) : (
                          <Text size="xs" c="dimmed">
                            No secrets
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>{age}</Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" width={200} shadow="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label="Actions"
                          >
                            <IconDotsVertical
                              style={{ width: rem(16), height: rem(16) }}
                            />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={
                              <IconEdit
                                style={{ width: rem(14), height: rem(14) }}
                              />
                            }
                            onClick={() => handleEditYaml(serviceAccount)}
                          >
                            Edit YAML
                          </Menu.Item>
                          <Menu.Item
                            leftSection={
                              <IconTrash
                                style={{ width: rem(14), height: rem(14) }}
                              />
                            }
                            color="red"
                            onClick={() => {
                              setSelectedServiceAccount(serviceAccount);
                              openDeleteModal();
                            }}
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
                <Table.Td colSpan={5} align="center">
                  {isLoading
                    ? 'Loading Service Accounts...'
                    : 'No Service Accounts found in this namespace'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && selectedServiceAccount && serviceAccountYaml && (
        <YamlEditor
          yaml={serviceAccountYaml}
          onSave={handleSaveYaml}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={`Edit Service Account: ${selectedServiceAccount.metadata.name}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteServiceAccount}
        title="Delete Service Account"
        message={`Are you sure you want to delete service account "${selectedServiceAccount?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete Service Account"
        isLoading={actionLoading}
      />
    </Container>
  );
};

export default ServiceAccountsPage;
