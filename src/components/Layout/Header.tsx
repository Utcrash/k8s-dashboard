import React from 'react';
import { Group, Title, Box } from '@mantine/core';

const Header: React.FC = () => {
  return (
    <Box
      py={10}
      px="md"
      h={60}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <Title order={4}>Kubernetes Dashboard</Title>
    </Box>
  );
};

export default Header;
