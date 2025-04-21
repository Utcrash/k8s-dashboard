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
  Chip,
  Group,
  Text,
  ActionIcon,
  Menu,
  rem,
  Tooltip,
  Checkbox,
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
  getServices,
  getNamespaces,
  getService,
  updateService,
  deleteService,
} from '../services/k8sService';
import YamlEditor from '../components/Common/YamlEditor';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { useNamespace } from '../context/NamespaceContext';

const ServicesPage: React.FC = () => {
  const { globalNamespace } = useNamespace();
  const [selectedNamespace, setSelectedNamespace] = useState(globalNamespace);
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [yamlEditorOpen, { open: openYamlEditor, close: closeYamlEditor }] =
    useDisclosure(false);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceYaml, setServiceYaml] = useState<any>(null);

  // Update the namespace when the global namespace changes
  useEffect(() => {
    setSelectedNamespace(globalNamespace);
  }, [globalNamespace]);

  // Fetch services when selected namespace changes
  useEffect(() => {
    fetchServices();
  }, [selectedNamespace]);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getServices(selectedNamespace);
      setServices(response.items || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to fetch services');
      setServices([]);
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

  const filteredServices = services.filter(
    (service) =>
      service.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.spec.type &&
        service.spec.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Edit YAML functionality
  const handleEditYaml = async (service: any) => {
    try {
      setSelectedService(service);
      setActionLoading(true);

      // Fetch the latest service definition
      const serviceData = await getService(
        service.metadata.name,
        service.metadata.namespace
      );
      setServiceYaml(serviceData);

      openYamlEditor();
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete service functionality
  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      setActionLoading(true);
      await deleteService(
        selectedService.metadata.name,
        selectedService.metadata.namespace
      );
      fetchServices(); // Refresh the list
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Save YAML changes
  const handleSaveYaml = async (updatedYaml: any) => {
    if (!selectedService) return;

    await updateService(
      selectedService.metadata.name,
      selectedService.metadata.namespace,
      updatedYaml
    );

    // Refresh the service list after successful update
    fetchServices();
  };

  return (
    <Container size="xl" p="md" mt="md" pos="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <Box
        mb="xl"
        mt={0}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingTop: 20,
        }}
      >
        <Title order={2}>Services</Title>
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
          placeholder="Search services..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchServices}
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
              <Table.Th>Type</Table.Th>
              <Table.Th>Cluster IP</Table.Th>
              <Table.Th>External IP</Table.Th>
              <Table.Th>Ports</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => {
                // Calculate age
                const creationTime = new Date(
                  service.metadata.creationTimestamp
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

                // Format ports
                const ports = service.spec.ports || [];

                // Format selector
                const selector = service.spec.selector || {};
                const selectorLabels = Object.entries(selector).map(
                  ([key, value]) => `${key}=${value}`
                );

                return (
                  <Table.Tr key={service.metadata.uid}>
                    <Table.Td>{service.metadata.name}</Table.Td>
                    <Table.Td>{service.spec.type || 'ClusterIP'}</Table.Td>
                    <Table.Td>{service.spec.clusterIP}</Table.Td>
                    <Table.Td>
                      {service.spec.externalIPs?.join(', ') ||
                        service.status?.loadBalancer?.ingress
                          ?.map((ing: any) => ing.ip || ing.hostname)
                          .join(', ') ||
                        '<none>'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {ports.map((port: any, index: number) => (
                          <Chip
                            key={index}
                            variant="light"
                            color="blue"
                            size="xs"
                          >
                            {`${port.port}${
                              port.nodePort ? `:${port.nodePort}` : ''
                            }/${port.protocol || 'TCP'}`}
                          </Chip>
                        ))}
                      </Group>
                    </Table.Td>
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
                              onClick={() => handleEditYaml(service)}
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
                                setSelectedService(service);
                                openDeleteModal();
                              }}
                            >
                              Delete Service
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
                  No services found in the selected namespace
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* YAML Editor Modal */}
      {yamlEditorOpen && selectedService && serviceYaml && (
        <YamlEditor
          yaml={serviceYaml}
          onSave={handleSaveYaml}
          isOpen={yamlEditorOpen}
          onClose={closeYamlEditor}
          title={`Edit Service: ${selectedService.metadata.name}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteService}
        title="Delete Service"
        message={`Are you sure you want to delete service "${selectedService?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete Service"
        isLoading={actionLoading}
      />
    </Container>
  );
};

export default ServicesPage;
