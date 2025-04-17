import React from 'react';
import { Modal, Button, Group, Text, Stack } from '@mantine/core';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  return (
    <Modal opened={isOpen} onClose={onClose} title={title} centered>
      <Stack>
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button color="red" onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmationModal;
