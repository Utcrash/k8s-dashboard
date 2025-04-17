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
import { getNamespaces } from '../services/k8sService';

const NamespacesPage: React.FC = () => {
  const [namespaces, setNamespaces] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch namespaces on initial load
  useEffect(() => {
    fetchNamespaces();
  }, []);

  const fetchNamespaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getNamespaces();
      setNamespaces(response.items || []);
    } catch (err) {
      console.error('Error fetching namespaces:', err);
      setError('Failed to fetch namespaces');
      setNamespaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredNamespaces = namespaces.filter((namespace) =>
    namespace.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        mt={20}
      >
        <Title order={2}>Namespaces</Title>
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
          placeholder="Search namespaces..."
          size="sm"
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<IconSearch size="1rem" />}
          style={{ maxWidth: 400, width: '100%' }}
        />
        <Button
          variant="outline"
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchNamespaces}
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
              <Table.Th>Status</Table.Th>
              <Table.Th>Age</Table.Th>
              <Table.Th>Labels</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredNamespaces.length > 0 ? (
              filteredNamespaces.map((namespace) => {
                // Calculate age
                const creationTime = new Date(
                  namespace.metadata.creationTimestamp
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

                // Format labels
                const labels = namespace.metadata.labels || {};
                const labelEntries = Object.entries(labels).map(
                  ([key, value]) => `${key}=${value}`
                );

                return (
                  <Table.Tr key={namespace.metadata.uid}>
                    <Table.Td>{namespace.metadata.name}</Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">
                        Active
                      </Badge>
                    </Table.Td>
                    <Table.Td>{age}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {labelEntries.length > 0 ? (
                          labelEntries.map((label, index) => (
                            <Badge key={index} variant="outline" size="xs">
                              {label}
                            </Badge>
                          ))
                        ) : (
                          <Text size="xs" c="dimmed">
                            No labels
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">
                  {isLoading ? 'Loading namespaces...' : 'No namespaces found'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
};

export default NamespacesPage;
