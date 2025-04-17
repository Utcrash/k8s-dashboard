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
} from '@mantine/core';
import { IconSearch, IconRefresh } from '@tabler/icons-react';
import NamespaceSelector from '../components/Namespaces/NamespaceSelector';
import { getServiceAccounts, getNamespaces } from '../services/k8sService';

const ServiceAccountsPage: React.FC = () => {
  const [serviceAccounts, setServiceAccounts] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>(['default']);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Fetch serviceAccounts when selected namespace changes
  useEffect(() => {
    fetchServiceAccounts();
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

  return (
    <Container size="xl" p="md" pos="relative">
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
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">
                  {isLoading
                    ? 'Loading Service Accounts...'
                    : 'No Service Accounts found in this namespace'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
};

export default ServiceAccountsPage;
