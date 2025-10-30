import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Stack,
  UnstyledButton,
  Text,
  Group,
  ScrollArea,
} from '@mantine/core';
import {
  IconBox,
  IconServer,
  IconFiles,
  IconUsers,
  IconRocket,
  IconLock,
} from '@tabler/icons-react';
import { useCurrentNamespace } from '../../hooks/useNamespace';

interface MainLinkProps {
  icon: typeof IconBox;
  label: string;
  path: string;
  cssClass: string;
}

function MainLink({ icon: Icon, label, path, cssClass }: MainLinkProps) {
  const { namespace } = useCurrentNamespace();
  
  // Build the full path with namespace
  const fullPath = `/${namespace}${path}`;

  return (
    <NavLink
      to={fullPath}
      className={({ isActive }) => `nav-link ${cssClass} ${isActive ? 'active' : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        <Icon size={18} />
        <Text size="sm">{label}</Text>
      </Group>
    </NavLink>
  );
}

const mainLinks = [
  { icon: IconRocket, label: 'Deployments', path: '/deployments', cssClass: 'nav-link-deployments' },
  { icon: IconBox, label: 'Pods', path: '/pods', cssClass: 'nav-link-pods' },
  { icon: IconServer, label: 'Services', path: '/services', cssClass: 'nav-link-services' },
  { icon: IconFiles, label: 'ConfigMaps', path: '/configmaps', cssClass: 'nav-link-configmaps' },
  { icon: IconUsers, label: 'ServiceAccounts', path: '/serviceaccounts', cssClass: 'nav-link-serviceaccounts' },
  { icon: IconLock, label: 'Secrets', path: '/secrets', cssClass: 'nav-link-secrets' },
];

export default function Sidebar() {
  const mainItems = mainLinks.map((link) => (
    <MainLink {...link} key={link.label} />
  ));

  return (
    <Box
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--mantine-color-dark-7)',
        borderTop: '1px solid var(--mantine-color-dark-6)',
        marginLeft: '280px', // Account for namespace sidebar width
        animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <ScrollArea style={{ flex: 1 }} type="never">
        <Group gap="xs" px="md" style={{ height: '60px', alignItems: 'center' }}>
          {mainItems}
        </Group>
      </ScrollArea>
    </Box>
  );
}
