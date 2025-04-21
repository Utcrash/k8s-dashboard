import React, { useState, useEffect } from 'react';
import { TextInput, Button, Group, Paper, Text } from '@mantine/core';

const TokenInput: React.FC = () => {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Check if token already exists
    const existingToken = localStorage.getItem('k8s_auth_token');
    if (existingToken) {
      setToken(existingToken);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('k8s_auth_token', token);
    setSaved(true);
  };

  const handleClear = () => {
    localStorage.removeItem('k8s_auth_token');
    setToken('');
    setSaved(false);
  };

  return (
    <Paper p="md" withBorder>
      <Text size="sm" mb="md">
        {saved
          ? 'Kubernetes API token is configured'
          : 'Enter your Kubernetes API token'}
      </Text>
      <Group>
        <TextInput
          placeholder="Paste Kubernetes token here"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1 }}
          type={saved ? 'password' : 'text'}
        />
        <Button onClick={handleSave} disabled={!token}>
          Save
        </Button>
        {saved && (
          <Button color="red" variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </Group>
    </Paper>
  );
};

export default TokenInput;
