import React from 'react';
import { Group, Title, Box, Flex } from '@mantine/core';
import GlobalNamespaceSelector from './GlobalNamespaceSelector';

const Header: React.FC = () => {
  return (
    <Box
      py={10}
      px="md"
      h={60}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(to right, #1565c0, #3f51b5)',
        color: 'white',
        justifyContent: 'space-between',
        zIndex: 1100,
        position: 'relative',
      }}
    >
      <Title order={4} c="white">
        Kubernetes Dashboard
      </Title>
      <GlobalNamespaceSelector />
    </Box>
  );
};

export default Header;
