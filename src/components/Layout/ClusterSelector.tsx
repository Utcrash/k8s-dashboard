import React from 'react';
import { Group, Select, Badge, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconServer, IconSettings } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useKubeConfig } from '../../context/KubeConfigContext';

const ClusterSelector: React.FC = () => {
  const { configs, activeConfig, setActiveConfig } = useKubeConfig();
  const navigate = useNavigate();

  // Debug logging
  console.log('ClusterSelector - configs:', configs);
  console.log('ClusterSelector - activeConfig:', activeConfig);

  const selectData = configs.map((config) => ({
    value: config.id,
    label: config.name,
    disabled: false,
  }));

  console.log('ClusterSelector - selectData:', selectData);

  const handleConfigChange = (value: string | null) => {
    if (value) {
      setActiveConfig(value);
    }
  };

  const handleManageConfigs = () => {
    navigate('/kubeconfig');
  };

  return (
    <Group gap="xs">
      <IconServer size={16} color="white" />
      <Select
        data={selectData}
        value={activeConfig?.id || null}
        onChange={handleConfigChange}
        placeholder="Select cluster"
        size="sm"
        style={{
          minWidth: 200,
          color: 'white',
        }}
        styles={{
          input: {
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
          dropdown: {
            backgroundColor: 'white',
            color: 'black',
          },
        }}
        comboboxProps={{ withinPortal: false }}
        renderOption={({ option }) => {
          const config = configs.find((c) => c.id === option.value);
          return (
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="dark">
                {option.label}
              </Text>
              {config?.isDefault && (
                <Badge size="xs" color="blue" variant="light">
                  Default
                </Badge>
              )}
            </Group>
          );
        }}
      />
      <Tooltip label="Manage cluster configurations">
        <ActionIcon variant="light" size="sm" onClick={handleManageConfigs}>
          <IconSettings size={14} />
        </ActionIcon>
      </Tooltip>
      {activeConfig && (
        <Text size="xs" c="rgba(255, 255, 255, 0.8)">
          {activeConfig.server}
        </Text>
      )}
    </Group>
  );
};

export default ClusterSelector;
