import React from 'react';
import { Box, AppShell } from '@mantine/core';
import Header from './Header';
import Sidebar from './Sidebar';
import NamespaceSidebar from './NamespaceSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AppShell
      header={{ height: 120 }}
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding={0}
    >
      <AppShell.Header>
        <Header />
        <Sidebar />
      </AppShell.Header>

      {/* Left sidebar for namespaces */}
      <AppShell.Navbar>
        <NamespaceSidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box style={{ padding: '16px', overflow: 'auto', height: 'calc(100vh - 120px)' }}>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default Layout;
