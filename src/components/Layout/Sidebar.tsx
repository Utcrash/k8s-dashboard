import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink, ScrollArea, Stack, Divider } from '@mantine/core';
import {
  IconHome,
  IconDatabase,
  IconList,
  IconSettings,
  IconFileDescription,
  IconSitemap,
  IconPuzzle,
} from '@tabler/icons-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <IconHome size="1.2rem" />, path: '/' },
    {
      text: 'Namespaces',
      icon: <IconDatabase size="1.2rem" />,
      path: '/namespaces',
    },
    { text: 'Pods', icon: <IconList size="1.2rem" />, path: '/pods' },
    {
      text: 'Services',
      icon: <IconSettings size="1.2rem" />,
      path: '/services',
    },
    {
      text: 'Deployments',
      icon: <IconSitemap size="1.2rem" />,
      path: '/deployments',
    },
    {
      text: 'ConfigMaps',
      icon: <IconFileDescription size="1.2rem" />,
      path: '/configmaps',
    },
    {
      text: 'Service Accounts',
      icon: <IconPuzzle size="1.2rem" />,
      path: '/serviceaccounts',
    },
  ];

  return (
    <ScrollArea>
      <Divider />
      <Stack gap={0}>
        {menuItems.map((item) => (
          <NavLink
            key={item.text}
            label={item.text}
            leftSection={item.icon}
            onClick={() => navigate(item.path)}
            active={location.pathname === item.path}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
};

export default Sidebar;
