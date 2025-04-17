import React from 'react';
import { Select, Box } from '@mantine/core';

interface NamespaceSelectorProps {
  namespaces: string[];
  selectedNamespace: string;
  onNamespaceChange: (namespace: string) => void;
}

const NamespaceSelector: React.FC<NamespaceSelectorProps> = ({
  namespaces,
  selectedNamespace,
  onNamespaceChange,
}) => {
  return (
    <Box mt={10}>
      <Select
        label="Namespace"
        value={selectedNamespace}
        onChange={(value) => value && onNamespaceChange(value)}
        data={namespaces.map((namespace) => ({
          value: namespace,
          label: namespace,
        }))}
        miw={200}
        size="sm"
        comboboxProps={{ position: 'bottom', zIndex: 1050 }}
        styles={{
          dropdown: {
            position: 'relative',
            zIndex: 1050,
          },
        }}
      />
    </Box>
  );
};

export default NamespaceSelector;
