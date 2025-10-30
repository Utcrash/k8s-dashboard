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
import { useCurrentNamespace } from '../../hooks/useNamespace';

const NamespaceList: React.FC = () => {
  const {
    availableNamespaces,
    pinnedNamespaces,
    togglePinNamespace,
    isLoading,
  } = useNamespace();
  
  const { namespace: currentNamespace, setNamespace } = useCurrentNamespace();

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

  const handleNamespaceClick = (clickedNamespace: string) => {
    setNamespace(clickedNamespace);
  };

  const NamespaceItem = ({ namespace: itemNamespace }: { namespace: string }) => {
    const isActive = itemNamespace === currentNamespace;
    const isPinned = pinnedNamespaces.includes(itemNamespace);
    

    return (
      <Group
        gap="xs"
        wrap="nowrap"
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: isActive ? 'var(--mantine-color-customBlue-5)' : 'transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `2px solid ${isActive ? 'var(--mantine-color-customBlue-5)' : 'transparent'}`,
          transform: isActive ? 'translateX(4px)' : 'translateX(0)',
          boxShadow: isActive ? '0 4px 12px rgba(59, 90, 170, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-dark-6)';
            e.currentTarget.style.borderColor = 'var(--mantine-color-customBlue-7)';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 90, 170, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }
        }}
      >
        <UnstyledButton
          onClick={() => handleNamespaceClick(itemNamespace)}
          style={{ flex: 1, textAlign: 'left' }}
        >
          <Text
            size="sm"
            fw={isActive ? 600 : 400}
            c={isActive ? 'white' : 'dark.1'}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {itemNamespace}
          </Text>
        </UnstyledButton>
        <Tooltip label={isPinned ? 'Unpin' : 'Pin'} position="right">
          <ActionIcon
            variant="subtle"
            color={isPinned ? 'yellow' : 'gray'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              togglePinNamespace(itemNamespace);
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
    <Box style={{ padding: '0' }}>
      {/* Search Input */}
      <Box mb="xs">
        <TextInput
          placeholder="Search namespaces..."
          leftSection={<IconSearch size={16} />}
          size="xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          style={{
            transition: 'all 0.3s ease',
          }}
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-dark-6)',
              border: '1px solid var(--mantine-color-dark-5)',
              color: 'var(--mantine-color-dark-0)',
              transition: 'all 0.3s ease',
              '&:focus': {
                borderColor: 'var(--mantine-color-customBlue-5)',
                boxShadow: '0 0 0 2px rgba(59, 90, 170, 0.2)',
              },
              '&:hover': {
                borderColor: 'var(--mantine-color-customBlue-7)',
              }
            }
          }}
        />
      </Box>

      {/* Pinned Namespaces */}
      {pinned.length > 0 && (
        <Box mb="xs">
          <Box py={4}>
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
            <Group gap="xs" py={4}>
              {isAllExpanded ? (
                <IconChevronDown size={14} />
              ) : (
                <IconChevronRight size={14} />
              )}
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                All Namespaces ({unpinned.length} of {availableNamespaces.length})
              </Text>
            </Group>
          </UnstyledButton>
          <Collapse in={isAllExpanded}>
            <Box 
              style={{ 
                maxHeight: 'calc(100vh - 280px)',
                minHeight: '100px',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--mantine-color-dark-4) var(--mantine-color-dark-8)',
              }}
              className="namespace-scroll-container"
            >
              <Box pb="xs">
                {unpinned.map((namespace) => (
                  <NamespaceItem key={namespace} namespace={namespace} />
                ))}
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* No Results */}
      {filteredNamespaces.length === 0 && !isLoading && (
        <Box py="md">
          <Text size="sm" c="dimmed" ta="center">
            No namespaces found
          </Text>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box py="md">
          <Box 
            className="loading-shimmer"
            style={{
              height: '40px',
              borderRadius: '8px',
              marginBottom: '8px',
              backgroundColor: 'var(--mantine-color-dark-6)',
            }}
          />
          <Box 
            className="loading-shimmer"
            style={{
              height: '40px',
              borderRadius: '8px',
              marginBottom: '8px',
              backgroundColor: 'var(--mantine-color-dark-6)',
            }}
          />
          <Box 
            className="loading-shimmer"
            style={{
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--mantine-color-dark-6)',
            }}
          />
          <Text size="xs" c="dimmed" ta="center" mt="md">
            Loading namespaces...
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default NamespaceList;

