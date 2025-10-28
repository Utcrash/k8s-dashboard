import React from 'react';
import {
  Box,
  Text,
  ScrollArea,
} from '@mantine/core';
import NamespaceList from './NamespaceList';

export default function NamespaceSidebar() {
  return (
    <Box
      style={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderRight: '1px solid var(--mantine-color-dark-6)',
        animation: 'slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <ScrollArea style={{ flex: 1 }}>
        <Box px="md" pt="sm" pb="md">
          {/* Header */}
          <Box mb="sm">
            <Text size="sm" fw={600} c="white" tt="uppercase" mb="xs">
              Namespaces
            </Text>
          </Box>

          {/* Namespace List */}
          <NamespaceList />
        </Box>
      </ScrollArea>
    </Box>
  );
}
