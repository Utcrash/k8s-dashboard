import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Stack,
  UnstyledButton,
  Text,
  Group,
  MantineTheme,
  ScrollArea,
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
  IconSettings,
} from '@tabler/icons-react';

interface MainLinkProps {
  icon: typeof IconDashboard;
  label: string;
  path: string;
}

function MainLink({ icon: Icon, label, path }: MainLinkProps) {
  return (
    <UnstyledButton
      component={NavLink}
      to={path}
      style={(theme: MantineTheme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colors.gray[7],
        '&:hover': {
          backgroundColor: theme.colors.gray[0],
        },
        '&.active': {
          backgroundColor: theme.colors.blue[0],
          color: theme.colors.blue[7],
        },
      })}
    >
      <Group>
        <Icon size={20} />
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const mainLinks = [
  { icon: IconDashboard, label: 'Dashboard', path: '/' },
  { icon: IconBox, label: 'Pods', path: '/pods' },
  { icon: IconServer, label: 'Services', path: '/services' },
  { icon: IconFolders, label: 'Namespaces', path: '/namespaces' },
  { icon: IconFiles, label: 'ConfigMaps', path: '/configmaps' },
  { icon: IconUsers, label: 'ServiceAccounts', path: '/serviceaccounts' },
  { icon: IconRocket, label: 'Deployments', path: '/deployments' },
  { icon: IconLock, label: 'Secrets', path: '/secrets' },
];

const settingsLinks = [{ icon: IconSettings, label: 'Token', path: '/token' }];

export default function Sidebar() {
  const mainItems = mainLinks.map((link) => (
    <MainLink {...link} key={link.label} />
  ));

  const settingsItems = settingsLinks.map((link) => (
    <MainLink {...link} key={link.label} />
  ));

  return (
    <Box
      style={(theme: MantineTheme) => ({
        height: '100vh',
        backgroundColor: theme.white,
        borderRight: `1px solid ${theme.colors.gray[2]}`,
        width: 260,
        display: 'flex',
        flexDirection: 'column',
      })}
    >
      <ScrollArea style={{ flex: 1 }}>
        <Stack p="md" gap="xl">
          <Stack gap="xs">
            <Text size="xs" fw={500} c="dimmed">
              MAIN
            </Text>
            {mainItems}
          </Stack>

          <Stack gap="xs">
            <Text size="xs" fw={500} c="dimmed">
              SETTINGS
            </Text>
            {settingsItems}
          </Stack>
        </Stack>
      </ScrollArea>
    </Box>
  );
}
