import React from 'react';
import { Box, Text, Group } from '@mantine/core';
import { useNamespace } from '../../context/NamespaceContext';

const GlobalNamespaceSelector: React.FC = () => {
  const {
    globalNamespace,
    setGlobalNamespace,
    availableNamespaces,
    isLoading,
  } = useNamespace();

  return (
    <Group align="center" gap="xs">
      <Text fw={500} size="sm" c="white">
        Namespace:
      </Text>
      <select
        value={globalNamespace}
        onChange={(e) => setGlobalNamespace(e.target.value)}
        disabled={isLoading}
        style={{
          width: 180,
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '12px',
          outline: 'none',
        }}
      >
        <option value="" disabled>
          Select namespace
        </option>
        {availableNamespaces.map((namespace) => (
          <option key={namespace} value={namespace}>
            {namespace}
          </option>
        ))}
      </select>
    </Group>
  );
};

export default GlobalNamespaceSelector;
