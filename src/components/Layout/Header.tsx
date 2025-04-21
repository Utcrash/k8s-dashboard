import React from 'react';
import { Group, Title, Box, Flex, ActionIcon, Tooltip } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import GlobalNamespaceSelector from './GlobalNamespaceSelector';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on the home page
  const showBackButton = location.pathname !== '/';

  const handleGoBack = () => {
    navigate(-1);
  };

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
      <Group>
        {showBackButton && (
          <Tooltip label="Go back" position="bottom">
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={handleGoBack}
              size="lg"
              radius="md"
            >
              <IconArrowLeft size="1.5rem" stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
        <Title order={4} c="white">
          Kubernetes Dashboard
        </Title>
      </Group>
      <GlobalNamespaceSelector />
    </Box>
  );
};

export default Header;
