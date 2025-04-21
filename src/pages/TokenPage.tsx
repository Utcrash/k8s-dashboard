import React from 'react';
import { Container, Paper, Title, Text, Box } from '@mantine/core';
import TokenInput from '../components/TokenInput';

const TokenPage: React.FC = () => {
  return (
    <Container size="xl" p="md">
      <Paper p="md" withBorder radius="md" shadow="sm" mb="xl">
        <Title order={2} fw={700} style={{ fontSize: '1.8rem' }}>
          API Authentication
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Configure your Kubernetes API authentication token
        </Text>

        <Paper p="md" withBorder radius="md" shadow="sm">
          <TokenInput />
        </Paper>
      </Paper>

      <Paper p="md" withBorder radius="md" shadow="sm">
        <Title order={3} mb="md">
          API Token Security
        </Title>
        <Text mb="md">
          Your Kubernetes API token provides access to your cluster resources.
          Please keep in mind:
        </Text>
        <Box component="ul" ml="xl">
          <Box component="li" mb="xs">
            <Text>
              The token is stored only in your browser's local storage
            </Text>
          </Box>
          <Box component="li" mb="xs">
            <Text>
              Tokens should be created with appropriate permissions (principle
              of least privilege)
            </Text>
          </Box>
          <Box component="li" mb="xs">
            <Text>
              Consider using tokens with expiration dates for improved security
            </Text>
          </Box>
          <Box component="li">
            <Text>
              Clear your token when you're done using the dashboard on shared
              computers
            </Text>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TokenPage;
