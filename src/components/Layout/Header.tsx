import React from 'react';
import { Group, Title, Box, Text, Badge } from '@mantine/core';
import { useCurrentNamespace } from '../../hooks/useNamespace';

const Header: React.FC = () => {
  const { namespace } = useCurrentNamespace();
  

  return (
    <Box
      py={10}
      px="md"
      h={60}
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderBottom: '1px solid var(--mantine-color-dark-6)',
        color: 'white',
        justifyContent: 'space-between',
        zIndex: 1100,
        position: 'relative',
      }}
    >
      <Group>
        <Title order={3} c="white" fw={600}>
          Kubernetes Dashboard
        </Title>
        <Badge 
          variant="light" 
          color="customBlue" 
          size="lg"
          style={{ 
            backgroundColor: 'var(--mantine-color-customBlue-5)',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(59, 90, 170, 0.3)',
            border: '1px solid rgba(59, 90, 170, 0.5)',
            animation: 'pulse 2s infinite',
          }}
        >
          Namespace: {namespace}
        </Badge>
      </Group>
    </Box>
  );
};

export default Header;
