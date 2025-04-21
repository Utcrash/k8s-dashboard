import React, { useState } from 'react';
import { Group, Button, Text, NumberInput, Stack } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { ContextModalProps } from '@mantine/modals';

// Update the interface for the inner props
interface ScaleDeploymentModalInnerProps {
  deploymentName: string;
  namespace: string;
  currentReplicas: number;
  onScale: (
    name: string,
    namespace: string,
    currentReplicas: number,
    newReplicas: number
  ) => Promise<void>;
}

// Create the modal component with ContextModalProps
export const ScaleDeploymentModal = ({
  context,
  id,
  innerProps,
}: ContextModalProps<ScaleDeploymentModalInnerProps>) => {
  const { deploymentName, namespace, currentReplicas, onScale } = innerProps;
  const [replicas, setReplicas] = useState<number>(currentReplicas);
  const [isLoading, setIsLoading] = useState(false);

  const handleScale = async () => {
    setIsLoading(true);
    try {
      await onScale(deploymentName, namespace, currentReplicas, replicas);
      context.closeModal(id);
    } catch (error) {
      console.error('Error scaling deployment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack>
      <Text>
        Adjust the number of replicas for deployment{' '}
        <strong>{deploymentName}</strong>
      </Text>

      <NumberInput
        label="Number of replicas"
        value={replicas}
        onChange={(value) => setReplicas(Number(value))}
        min={0}
        max={100}
        step={1}
        leftSection={<IconMinus size="1rem" />}
        rightSection={<IconPlus size="1rem" />}
      />

      <Group justify="flex-end" mt="md">
        <Button
          variant="outline"
          onClick={() => context.closeModal(id)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleScale}
          loading={isLoading}
          disabled={replicas === currentReplicas}
        >
          Scale Deployment
        </Button>
      </Group>
    </Stack>
  );
};

export default ScaleDeploymentModal;
