import React, { useState, useEffect } from 'react';
import {
  TextInput,
  Button,
  Group,
  Paper,
  Text,
  Flex,
  Title,
  Box,
  Transition,
  Alert,
  Tooltip,
  CopyButton,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core';

const TokenInput: React.FC = () => {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    // Check if token already exists
    const existingToken = localStorage.getItem('k8s_auth_token');
    if (existingToken) {
      setToken(existingToken);
      setSaved(true);
    }
  }, []);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSave = () => {
    localStorage.setItem('k8s_auth_token', token);
    setSaved(true);
    setFeedback({
      message: 'Token saved successfully',
      color: 'green',
    });
  };

  const handleClear = () => {
    localStorage.removeItem('k8s_auth_token');
    setToken('');
    setSaved(false);
    setFeedback({
      message: 'Token has been cleared',
      color: 'orange',
    });
  };

  return (
    <Flex direction="column" gap="md">
      <Group justify="space-between" align="center">
        <Box>
          <Title order={4}>API Authentication</Title>
          <Text size="sm" c="dimmed">
            {saved
              ? 'Your Kubernetes API access is configured'
              : 'Configure your Kubernetes API access'}
          </Text>
        </Box>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide instructions' : 'Show instructions'}
        </Button>
      </Group>

      {feedback && (
        <Text fw={500} c={feedback.color} size="sm">
          {feedback.message}
        </Text>
      )}

      <Transition
        mounted={showInstructions}
        transition="slide-down"
        duration={300}
      >
        {(styles) => (
          <Alert
            style={styles}
            color="blue"
            title="How to get your Kubernetes API token"
            variant="light"
            radius="md"
          >
            <Text size="sm">
              Run this command to create a token with the necessary permissions:
            </Text>
            <Group mt="xs" mb="xs">
              <Box
                style={{
                  background: '#f1f3f5',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  flex: 1,
                }}
              >
                kubectl create token k8s-dashboard --duration=8760h
              </Box>
              <CopyButton value="kubectl create token k8s-dashboard --duration=8760h">
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied' : 'Copy'}
                    withArrow
                    position="right"
                  >
                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? '✓' : '📋'}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Text size="sm">
              This creates a token valid for 1 year. Paste it below to enable
              API access.
            </Text>
          </Alert>
        )}
      </Transition>

      <Group align="flex-end">
        <TextInput
          label={
            saved ? 'Kubernetes API token (hidden)' : 'Kubernetes API token'
          }
          description={
            saved
              ? 'Your token is securely stored in your browser'
              : 'Paste your Kubernetes API token'
          }
          placeholder="Paste your token here..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1 }}
          type={saved ? 'password' : 'text'}
          radius="md"
        />
        {saved ? (
          <Group>
            <Button
              color="teal"
              variant="light"
              onClick={() => setSaved(false)}
              radius="md"
            >
              Change
            </Button>
            <Button
              color="red"
              variant="light"
              onClick={handleClear}
              radius="md"
            >
              Clear
            </Button>
          </Group>
        ) : (
          <Button
            color="blue"
            onClick={handleSave}
            disabled={!token}
            radius="md"
          >
            Save Token
          </Button>
        )}
      </Group>

      {!saved && (
        <Text size="xs" c="dimmed" mt="xs">
          Your token will be stored locally in your browser and included in API
          requests
        </Text>
      )}
    </Flex>
  );
};

export default TokenInput;
