import React from 'react';
import { Select, Box, Badge, Group } from '@mantine/core';

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
        searchable
        nothingFoundMessage="No namespaces found"
        rightSection={
          <Badge size="xs" color="blue" variant="light">
            {namespaces.length}
          </Badge>
        }
        miw={200}
        size="sm"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            const searchValue = (event.target as HTMLInputElement).value;
            if (namespaces.includes(searchValue)) {
              onNamespaceChange(searchValue);
            }
          }
        }}
        comboboxProps={{
          position: 'bottom-start',
          offset: 0,
          middlewares: { flip: true, shift: true },
          zIndex: 1050,
        }}
        styles={{
          dropdown: {
            position: 'absolute',
            zIndex: 1050,
            maxHeight: '300px',
            overflowY: 'auto',
          },
        }}
        maxDropdownHeight={300}
      />
    </Box>
  );
};

export default NamespaceSelector;
