import React, { useState, useMemo } from 'react';
import {
  Box,
  TextInput,
  Text,
  ScrollArea,
  Group,
  ActionIcon,
  Collapse,
  UnstyledButton,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconStar,
  IconStarFilled,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { useNamespace } from '../../context/NamespaceContext';
import { useGlobalNamespace } from '../../hooks/useGlobalNamespace';

const NamespaceList: React.FC = () => {
  const {
    availableNamespaces,
    pinnedNamespaces,
    togglePinNamespace,
    isLoading,
  } = useNamespace();
  
  const { globalNamespace, setGlobalNamespace } = useGlobalNamespace();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAllExpanded, setIsAllExpanded] = useState(true);

  // Filter namespaces based on search term
  const filteredNamespaces = useMemo(() => {
    return availableNamespaces.filter((ns) =>
      ns.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableNamespaces, searchTerm]);

  // Separate pinned and unpinned namespaces
  const { pinned, unpinned } = useMemo(() => {
    const pinned = filteredNamespaces.filter((ns) =>
      pinnedNamespaces.includes(ns)
    );
    const unpinned = filteredNamespaces.filter(
      (ns) => !pinnedNamespaces.includes(ns)
    );
    return { pinned, unpinned };
  }, [filteredNamespaces, pinnedNamespaces]);

  const handleNamespaceClick = (namespace: string) => {
    setGlobalNamespace(namespace);
  };

  const NamespaceItem = ({ namespace }: { namespace: string }) => {
    const isActive = namespace === globalNamespace;
    const isPinned = pinnedNamespaces.includes(namespace);

    return (
      <Group
        gap="xs"
        wrap="nowrap"
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: isActive ? '#f0f0f0' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = '#f8f8f8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <UnstyledButton
          onClick={() => handleNamespaceClick(namespace)}
          style={{ flex: 1, textAlign: 'left' }}
        >
          <Text
            size="sm"
            fw={isActive ? 600 : 400}
            c={isActive ? 'blue' : 'dark'}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {namespace}
          </Text>
        </UnstyledButton>
        <Tooltip label={isPinned ? 'Unpin' : 'Pin'} position="right">
          <ActionIcon
            variant="subtle"
            color={isPinned ? 'yellow' : 'gray'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              togglePinNamespace(namespace);
            }}
          >
            {isPinned ? (
              <IconStarFilled size={14} />
            ) : (
              <IconStar size={14} />
            )}
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  };

  return (
    <Box style={{ padding: '8px 0' }}>
      {/* Search Input */}
      <Box px="md" mb="xs">
        <TextInput
          placeholder="Search namespaces..."
          leftSection={<IconSearch size={16} />}
          size="xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </Box>

      {/* Pinned Namespaces */}
      {pinned.length > 0 && (
        <Box mb="xs">
          <Box px="md" py={4}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Pinned
            </Text>
          </Box>
          <Box>
            {pinned.map((namespace) => (
              <NamespaceItem key={namespace} namespace={namespace} />
            ))}
          </Box>
        </Box>
      )}

      {/* All Namespaces (Collapsible) */}
      {unpinned.length > 0 && (
        <Box>
          <UnstyledButton
            onClick={() => setIsAllExpanded(!isAllExpanded)}
            style={{ width: '100%' }}
          >
            <Group gap="xs" px="md" py={4}>
              {isAllExpanded ? (
                <IconChevronDown size={14} />
              ) : (
                <IconChevronRight size={14} />
              )}
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                All Namespaces ({unpinned.length})
              </Text>
            </Group>
          </UnstyledButton>
          <Collapse in={isAllExpanded}>
            <ScrollArea style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '200px' }}>
              <Box>
                {unpinned.map((namespace) => (
                  <NamespaceItem key={namespace} namespace={namespace} />
                ))}
              </Box>
            </ScrollArea>
          </Collapse>
        </Box>
      )}

      {/* No Results */}
      {filteredNamespaces.length === 0 && !isLoading && (
        <Box px="md" py="md">
          <Text size="sm" c="dimmed" ta="center">
            No namespaces found
          </Text>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box px="md" py="md">
          <Text size="sm" c="dimmed" ta="center">
            Loading namespaces...
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default NamespaceList;

