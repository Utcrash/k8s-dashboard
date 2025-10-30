import React from 'react';
import { Box, Badge, Group } from '@mantine/core';

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
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontSize: '14px', 
          fontWeight: 500 
        }}>
          Namespace
        </label>
        <Group gap="xs">
          <select
            value={selectedNamespace}
            onChange={(e) => onNamespaceChange(e.target.value)}
            style={{
              minWidth: 200,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            {namespaces.map((namespace) => (
              <option key={namespace} value={namespace}>
                {namespace}
              </option>
            ))}
          </select>
          <Badge size="xs" color="blue" variant="light">
            {namespaces.length}
          </Badge>
        </Group>
      </div>
    </Box>
  );
};

export default NamespaceSelector;
