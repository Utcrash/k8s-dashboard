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
  Accordion,
  Code,
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
            title="How to set up Kubernetes API access"
            variant="light"
            radius="md"
          >
            <Accordion variant="separated" radius="md">
              <Accordion.Item value="create-account">
                <Accordion.Control>
                  Step 1: Create a service account with proper permissions
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" mb="xs">
                    Run these commands to create a service account in the
                    default namespace with admin rights:
                  </Text>
                  <Box
                    style={{
                      background: '#f1f3f5',
                      padding: '12px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      marginBottom: '8px',
                    }}
                  >
                    <Code block>
                      # Create a service account in the default namespace
                      kubectl create serviceaccount k8s-dashboard -n default #
                      Give it admin permissions kubectl create
                      clusterrolebinding k8s-dashboard-binding \
                      --clusterrole=cluster-admin \
                      --serviceaccount=default:k8s-dashboard
                    </Code>
                  </Box>
                  <CopyButton
                    value={`kubectl create serviceaccount k8s-dashboard -n default\nkubectl create clusterrolebinding k8s-dashboard-binding --clusterrole=cluster-admin --serviceaccount=default:k8s-dashboard`}
                  >
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        color={copied ? 'teal' : 'blue'}
                        onClick={copy}
                        mb="md"
                      >
                        {copied ? 'Copied!' : 'Copy commands'}
                      </Button>
                    )}
                  </CopyButton>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="create-token">
                <Accordion.Control>
                  Step 2: Create a token for the service account
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" mb="xs">
                    Generate a token for the service account you just created:
                  </Text>
                  <Box
                    style={{
                      background: '#f1f3f5',
                      padding: '12px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      marginBottom: '8px',
                    }}
                  >
                    <Code block>
                      kubectl create token k8s-dashboard -n default
                      --duration=8760h
                    </Code>
                  </Box>
                  <CopyButton value="kubectl create token k8s-dashboard -n default --duration=8760h">
                    {({ copied, copy }) => (
                      <Button
                        size="xs"
                        color={copied ? 'teal' : 'blue'}
                        onClick={copy}
                        mb="md"
                      >
                        {copied ? 'Copied!' : 'Copy command'}
                      </Button>
                    )}
                  </CopyButton>
                  <Text size="sm" mt="xs">
                    This creates a token valid for 1 year. Copy the generated
                    token and paste it below.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="troubleshooting">
                <Accordion.Control>
                  Troubleshooting API Access
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" fw={500} mb="xs">
                    If you see "Unauthorized" errors:
                  </Text>
                  <Box component="ul" ml="md">
                    <Box component="li" mb="xs">
                      <Text size="sm">
                        Make sure you created the service account in the{' '}
                        <b>default</b> namespace
                      </Text>
                    </Box>
                    <Box component="li" mb="xs">
                      <Text size="sm">
                        Verify the cluster role binding was created correctly
                      </Text>
                    </Box>
                    <Box component="li" mb="xs">
                      <Text size="sm">
                        Clear your token and generate a new one with the above
                        commands
                      </Text>
                    </Box>
                    <Box component="li">
                      <Text size="sm">
                        Check your cluster's RBAC settings for any restrictions
                      </Text>
                    </Box>
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
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
