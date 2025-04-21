import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink, ScrollArea, Stack, Divider, Text, Box } from '@mantine/core';
import {
  IconDashboard,
  IconBox,
  IconServer,
  IconNetwork,
  IconApps,
  IconFiles,
  IconUserShield,
  IconKey,
} from '@tabler/icons-react';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  category: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      text: 'Dashboard',
      icon: <IconDashboard size="1.3rem" stroke={1.5} />,
      path: '/',
      category: 'Overview',
    },
    {
      text: 'Namespaces',
      icon: <IconServer size="1.3rem" stroke={1.5} />,
      path: '/namespaces',
      category: 'Overview',
    },
    {
      text: 'Pods',
      icon: <IconBox size="1.3rem" stroke={1.5} />,
      path: '/pods',
      category: 'Workloads',
    },
    {
      text: 'Services',
      icon: <IconNetwork size="1.3rem" stroke={1.5} />,
      path: '/services',
      category: 'Networking',
    },
    {
      text: 'Deployments',
      icon: <IconApps size="1.3rem" stroke={1.5} />,
      path: '/deployments',
      category: 'Workloads',
    },
    {
      text: 'ConfigMaps',
      icon: <IconFiles size="1.3rem" stroke={1.5} />,
      path: '/configmaps',
      category: 'Configuration',
    },
    {
      text: 'Service Accounts',
      icon: <IconUserShield size="1.3rem" stroke={1.5} />,
      path: '/serviceaccounts',
      category: 'Configuration',
    },
    {
      text: 'API Token',
      icon: <IconKey size="1.3rem" stroke={1.5} />,
      path: '/token',
      category: 'Settings',
    },
  ];

  // Group items by category
  const categories = menuItems.reduce<Record<string, MenuItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <Box style={{ width: '100%' }}>
      <ScrollArea>
        <Divider />
        <Stack gap="lg" py="md" px="xs">
          {Object.entries(categories).map(([category, items]) => (
            <Box key={category}>
              <Text
                size="xs"
                c="dimmed"
                fw={600}
                pb="xs"
                pl="xs"
                tt="uppercase"
              >
                {category}
              </Text>
              <Stack gap="md">
                {items.map((item) => (
                  <NavLink
                    key={item.text}
                    label={
                      <Text fw={location.pathname === item.path ? 600 : 400}>
                        {item.text}
                      </Text>
                    }
                    leftSection={item.icon}
                    onClick={() => navigate(item.path)}
                    active={
                      location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
                    }
                    py="md"
                    styles={(theme) => ({
                      root: {
                        borderRadius: theme.radius.md,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor:
                            location.pathname === item.path
                              ? theme.colors.blue[6]
                              : theme.colors.gray[1],
                          transform: 'translateX(4px)',
                        },
                      },
                    })}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  );
};

export default Sidebar;
