import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import {
  Paper,
  Group,
  Button,
  Modal,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceFloppy, IconX, IconCheck } from '@tabler/icons-react';

interface YamlEditorProps {
  yaml: any;
  onSave: (yaml: any) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const YamlEditor: React.FC<YamlEditorProps> = ({
  yaml,
  onSave,
  isOpen,
  onClose,
  title,
}) => {
  const [yamlContent, setYamlContent] = useState<string>(
    typeof yaml === 'string' ? yaml : JSON.stringify(yaml, null, 2)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmClose, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Parse YAML to JSON
      const parsedYaml = JSON.parse(yamlContent);

      // Save changes
      await onSave(parsedYaml);

      // Close editor on success
      onClose();
    } catch (error) {
      console.error('Error saving YAML:', error);
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save changes'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setYamlContent(value);
    }
  };

  const handleClose = () => {
    // If content has been modified, ask for confirmation before closing
    if (
      yamlContent !==
      (typeof yaml === 'string' ? yaml : JSON.stringify(yaml, null, 2))
    ) {
      openConfirm();
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={handleClose}
        title={title}
        size="xl"
        fullScreen
        padding="md"
      >
        <Stack h="calc(100vh - 150px)">
          <Paper withBorder p={0} style={{ flexGrow: 1 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={yamlContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </Paper>

          {saveError && (
            <Paper p="md" withBorder style={{ backgroundColor: '#ffebee' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {saveError}
              </pre>
            </Paper>
          )}

          <Group justify="flex-end">
            <Button
              variant="outline"
              leftSection={<IconX size="1rem" />}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size="1rem" />}
              onClick={handleSave}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirmation dialog for unsaved changes */}
      <Modal
        opened={confirmClose}
        onClose={closeConfirm}
        title="Unsaved Changes"
        centered
      >
        <Stack>
          <p>
            You have unsaved changes. Are you sure you want to close the editor?
          </p>
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeConfirm}>
              Continue Editing
            </Button>
            <Button
              color="red"
              onClick={() => {
                closeConfirm();
                onClose();
              }}
            >
              Discard Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default YamlEditor;
