import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Stack,
  UnstyledButton,
  Text,
  Group,
  ScrollArea,
  Divider,
} from '@mantine/core';
import {
  IconDashboard,
  IconBox,
  IconServer,
  IconFolders,
  IconFiles,
  IconUsers,
  IconRocket,
  IconLock,
} from '@tabler/icons-react';
import { useNamespace } from '../../context/NamespaceContext';
import NamespaceList from './NamespaceList';

interface MainLinkProps {
  icon: typeof IconDashboard;
  label: string;
  path: string;
}

function MainLink({ icon: Icon, label, path }: MainLinkProps) {
  const { globalNamespace } = useNamespace();
  
  // Build the full path with namespace
  const fullPath = path === '/namespaces'
    ? path 
    : `/${globalNamespace}${path}`;

  return (
    <UnstyledButton
      component={NavLink}
      to={fullPath}
      style={({ isActive }: any) => ({
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        borderRadius: '4px',
        textDecoration: 'none',
        backgroundColor: isActive ? '#e3f2fd' : 'transparent',
        color: isActive ? '#1976d2' : '#495057',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s ease',
      })}
      onMouseEnter={(e: any) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }
      }}
      onMouseLeave={(e: any) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Group gap="sm">
        <Icon size={20} />
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const mainLinks = [
  { icon: IconDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: IconBox, label: 'Pods', path: '/pods' },
  { icon: IconServer, label: 'Services', path: '/services' },
  { icon: IconFolders, label: 'Namespaces', path: '/namespaces' },
  { icon: IconFiles, label: 'ConfigMaps', path: '/configmaps' },
  { icon: IconUsers, label: 'ServiceAccounts', path: '/serviceaccounts' },
  { icon: IconRocket, label: 'Deployments', path: '/deployments' },
  { icon: IconLock, label: 'Secrets', path: '/secrets' },
];

export default function Sidebar() {
  const mainItems = mainLinks.map((link) => (
    <MainLink {...link} key={link.label} />
  ));

  return (
    <Box
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="md" pb="md">
          {/* Namespace Selector Section */}
          <Box>
            <Box px="md" pt="md" pb="xs">
              <Text size="xs" fw={500} c="dimmed">
                NAMESPACE
              </Text>
            </Box>
            <NamespaceList />
          </Box>

          <Divider />

          {/* Main Navigation */}
          <Box px="md">
            <Stack gap="xs">
              <Text size="xs" fw={500} c="dimmed">
                NAVIGATION
              </Text>
              {mainItems}
            </Stack>
          </Box>
        </Stack>
      </ScrollArea>
    </Box>
  );
}
