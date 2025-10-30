import React, { useState } from 'react';
import {
  Group,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Menu,
  Text,
} from '@mantine/core';
import {
  IconServer,
  IconPlus,
  IconSettings,
  IconPlugConnected,
  IconPlugConnectedX,
  IconRefresh,
  IconEdit,
} from '@tabler/icons-react';
import { useCluster } from '../../context/ClusterContext';
import ClusterSetup from './ClusterSetup';
import ClusterEdit from './ClusterEdit';

const ClusterSwitcher: React.FC = () => {
  const {
    clusters,
    selectedCluster,
    selectCluster,
    connectToCluster,
    disconnectFromCluster,
    loadClusters,
  } = useCluster();

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleClusterChange = (clusterId: string | null) => {
    if (clusterId) {
      selectCluster(clusterId);
    }
  };

  const handleConnect = async (clusterId: string) => {
    try {
      await connectToCluster(clusterId);
    } catch (error) {
      console.error('Failed to connect to cluster:', error);
    }
  };

  const handleDisconnect = async (clusterId: string) => {
    try {
      await disconnectFromCluster(clusterId);
    } catch (error) {
      console.error('Failed to disconnect from cluster:', error);
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'prod': return 'red';
      case 'staging': return 'orange';
      case 'dev': return 'blue';
      case 'test': return 'grape';
      default: return 'gray';
    }
  };


  return (
    <>
      <Group gap="xs" wrap="nowrap">
        {/* Cluster Icon */}
        <IconServer size={20} color="var(--mantine-color-blue-5)" />

        {/* Cluster Selector */}
        <select
          value={selectedCluster?.id || ''}
          onChange={(e) => handleClusterChange(e.target.value || null)}
          disabled={clusters.length === 0}
          style={{
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #495057',
            backgroundColor: '#2c2e33',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        >
          <option value="" disabled>
            {clusters.length === 0 ? "No clusters available" : "Select Cluster"}
          </option>
          {clusters.map(cluster => (
            <option key={cluster.id} value={cluster.id}>
              [{cluster.environment.toUpperCase()}] {cluster.name}
            </option>
          ))}
        </select>

        {/* Environment Badge */}
        {selectedCluster && (
          <Badge
            color={getEnvironmentColor(selectedCluster.environment)}
            variant="light"
            size="sm"
          >
            {selectedCluster.environment.toUpperCase()}
          </Badge>
        )}

        {/* Connection Status */}
        {selectedCluster && (
          <Tooltip
            label={selectedCluster.isConnected ? 'Connected' : 'Disconnected'}
            position="bottom"
          >
            <ActionIcon
              variant="subtle"
              color={selectedCluster.isConnected ? 'green' : 'gray'}
              size="sm"
              onClick={() => 
                selectedCluster.isConnected 
                  ? handleDisconnect(selectedCluster.id)
                  : handleConnect(selectedCluster.id)
              }
            >
              {selectedCluster.isConnected ? (
                <IconPlugConnected size={16} />
              ) : (
                <IconPlugConnectedX size={16} />
              )}
            </ActionIcon>
          </Tooltip>
        )}

        {/* Cluster Actions Menu */}
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm">
              <IconSettings size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Cluster Actions</Menu.Label>
            
            <Menu.Item
              leftSection={<IconPlus size={16} />}
              onClick={() => setSetupModalOpen(true)}
            >
              Add New Cluster
            </Menu.Item>

            <Menu.Item
              leftSection={<IconRefresh size={16} />}
              onClick={loadClusters}
            >
              Refresh Clusters
            </Menu.Item>

            {selectedCluster && (
              <>
                <Menu.Divider />
                <Menu.Label>Current Cluster</Menu.Label>
                
                <Menu.Item disabled>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {selectedCluster.name}
                    </Text>
                    <Badge size="xs" color={getEnvironmentColor(selectedCluster.environment)}>
                      {selectedCluster.environment}
                    </Badge>
                  </Group>
                </Menu.Item>

                {selectedCluster.region && (
                  <Menu.Item disabled>
                    <Text size="xs" c="dimmed">
                      Region: {selectedCluster.region}
                    </Text>
                  </Menu.Item>
                )}

                <Menu.Item
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setEditModalOpen(true)}
                >
                  Edit Cluster
                </Menu.Item>

                <Menu.Item
                  leftSection={
                    selectedCluster.isConnected ? (
                      <IconPlugConnectedX size={16} />
                    ) : (
                      <IconPlugConnected size={16} />
                    )
                  }
                  onClick={() => 
                    selectedCluster.isConnected 
                      ? handleDisconnect(selectedCluster.id)
                      : handleConnect(selectedCluster.id)
                  }
                >
                  {selectedCluster.isConnected ? 'Disconnect' : 'Connect'}
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Cluster Setup Modal */}
      <ClusterSetup
        opened={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />

      {/* Cluster Edit Modal */}
      <ClusterEdit
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cluster={selectedCluster}
      />
    </>
  );
};

export default ClusterSwitcher;
