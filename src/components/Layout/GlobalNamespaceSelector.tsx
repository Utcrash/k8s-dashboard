import React from 'react';
import { Select, Box, Text, Group } from '@mantine/core';
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
      <Select
        placeholder="Select namespace"
        value={globalNamespace}
        onChange={(value) => value && setGlobalNamespace(value)}
        data={availableNamespaces.map((namespace) => ({
          value: namespace,
          label: namespace,
        }))}
        size="xs"
        w={180}
        searchable
        nothingFoundMessage="No namespaces found"
        comboboxProps={{
          position: 'bottom-start',
          offset: 5,
          middlewares: { flip: true, shift: true },
          zIndex: 1050,
        }}
        styles={(theme) => ({
          input: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            '&:focus': {
              borderColor: theme.colors.blue[2],
            },
          },
          dropdown: {
            position: 'absolute',
            zIndex: 1050,
            maxHeight: '300px',
            overflowY: 'auto',
          },
          option: {
            '&[data-selected]': {
              backgroundColor: theme.colors.blue[5],
            },
          },
        })}
        disabled={isLoading}
        maxDropdownHeight={300}
      />
    </Group>
  );
};

export default GlobalNamespaceSelector;
