import React from 'react';
import { Box, AppShell } from '@mantine/core';
import Header from './Header';
import Sidebar from './Sidebar';
import {
  IconDashboard,
  IconBox,
  IconServer,
  IconFolders,
  IconFiles,
  IconUsers,
  IconRocket,
  IconLock,
  IconCloudCode,
  IconSettings,
} from '@tabler/icons-react';

interface LayoutProps {
  children: React.ReactNode;
}

const mainLinks = [
  { icon: IconDashboard, label: 'Dashboard', path: '/k8s/dashboard' },
  { icon: IconBox, label: 'Pods', path: '/k8s/pods' },
  { icon: IconServer, label: 'Services', path: '/k8s/services' },
  { icon: IconFolders, label: 'Namespaces', path: '/k8s/namespaces' },
  { icon: IconFiles, label: 'ConfigMaps', path: '/k8s/configmaps' },
  { icon: IconUsers, label: 'ServiceAccounts', path: '/k8s/serviceaccounts' },
  { icon: IconRocket, label: 'Deployments', path: '/k8s/deployments' },
  { icon: IconLock, label: 'Secrets', path: '/k8s/secrets' },
];

const settingsLinks = [
  { icon: IconCloudCode, label: 'KubeConfig', path: '/k8s/kubeconfig' },
  { icon: IconSettings, label: 'Settings', path: '/k8s/settings' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main pt={70}>{children}</AppShell.Main>
    </AppShell>
  );
};

export default Layout;
