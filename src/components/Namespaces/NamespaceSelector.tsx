import React from 'react';
import { Select } from '@mantine/core';

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
  );
};

export default NamespaceSelector;
