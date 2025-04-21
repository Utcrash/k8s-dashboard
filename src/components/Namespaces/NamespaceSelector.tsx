import React from 'react';
import { Select, Box, Group, Text, Badge } from '@mantine/core';
import { useNamespace } from '../../context/NamespaceContext';

// Changed component to take minimal props
interface NamespaceSelectorProps {
  onNamespaceChange?: (namespace: string) => void;
}

const NamespaceSelector: React.FC<NamespaceSelectorProps> = ({
  onNamespaceChange,
}) => {
  const {
    globalNamespace,
    setGlobalNamespace,
    availableNamespaces,
    isLoading,
  } = useNamespace();

  const handleChange = (value: string | null) => {
    if (value) {
      // Update the global namespace directly
      setGlobalNamespace(value);

      // If there's a local callback, call that too
      if (onNamespaceChange) {
        onNamespaceChange(value);
      }
    }
  };

  return (
    <Group gap="xs" align="center">
      <Text fw={500} size="sm">
        Namespace:
      </Text>
      <Select
        placeholder="Select namespace"
        value={globalNamespace}
        onChange={handleChange}
        data={availableNamespaces.map((namespace) => ({
          value: namespace,
          label: namespace,
        }))}
        size="sm"
        w={200}
        searchable
        nothingFoundMessage="No namespaces found"
        rightSection={
          <Badge size="xs" variant="filled" color="blue">
            {availableNamespaces.length}
          </Badge>
        }
        disabled={isLoading}
      />
    </Group>
  );
};

export default NamespaceSelector;
