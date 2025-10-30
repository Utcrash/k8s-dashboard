import React, { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  FileInput,
  Alert,
  LoadingOverlay,
  NumberInput,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUpload } from '@tabler/icons-react';
import { useCluster } from '../../context/ClusterContext';
import { ClusterFormData, ClusterFormErrors, ClusterConfig } from '../../types/cluster';

interface ClusterSetupProps {
  opened: boolean;
  onClose: () => void;
}

const ClusterSetup: React.FC<ClusterSetupProps> = ({ opened, onClose }) => {
  const { addCluster, testClusterConnection } = useCluster();
  
  const [formData, setFormData] = useState<ClusterFormData>({
    name: '',
    region: '',
    environment: 'dev',
    sshHost: '',
    sshUsername: 'ubuntu',
    sshPort: '22',
    pemFileContent: '',
    kubeconfigContent: '',
  });

  const [errors, setErrors] = useState<ClusterFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof ClusterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePemFileUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, pemFileContent: content }));
        setErrors(prev => ({ ...prev, pemFileContent: undefined }));
      };
      reader.readAsText(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ClusterFormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Cluster name is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.sshHost.trim()) newErrors.sshHost = 'SSH host is required';
    if (!formData.sshUsername.trim()) newErrors.sshUsername = 'SSH username is required';
    if (!formData.sshPort.trim() || isNaN(Number(formData.sshPort))) {
      newErrors.sshPort = 'Valid SSH port is required';
    }
    if (!formData.pemFileContent.trim()) newErrors.pemFileContent = 'PEM file is required';
    if (!formData.kubeconfigContent.trim()) newErrors.kubeconfigContent = 'Kubeconfig is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      // Test connection without storing data
      const testConfig: ClusterConfig = {
        id: formData.name.trim(), // Use name as ID
        name: formData.name.trim(),
        region: formData.region,
        environment: formData.environment,
        sshConfig: {
          host: formData.sshHost,
          username: formData.sshUsername,
          port: Number(formData.sshPort),
          pemFile: btoa(formData.pemFileContent),
        },
        kubeconfig: btoa(formData.kubeconfigContent),
      };

      const result = await testClusterConnection(testConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const config: ClusterConfig = {
        id: formData.name.trim(), // Use name as ID
        name: formData.name.trim(),
        region: formData.region,
        environment: formData.environment,
        sshConfig: {
          host: formData.sshHost,
          username: formData.sshUsername,
          port: Number(formData.sshPort),
          pemFile: btoa(formData.pemFileContent),
        },
        kubeconfig: btoa(formData.kubeconfigContent),
      };

      await addCluster(config);
      
      // Reset form and close modal
      setFormData({
        name: '',
        region: '',
        environment: 'dev',
        sshHost: '',
        sshUsername: 'ubuntu',
        sshPort: '22',
        pemFileContent: '',
        kubeconfigContent: '',
      });
      setErrors({});
      setTestResult(null);
      onClose();
    } catch (error) {
      console.error('Failed to add cluster:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add New Cluster"
      size="lg"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        {/* Basic Information */}
        <TextInput
          label="Cluster Name"
          placeholder="e.g., Production EKS"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
        />

        <Group grow>
          <TextInput
            label="Region"
            placeholder="e.g., us-east-1"
            value={formData.region}
            onChange={(e) => handleInputChange('region', e.target.value)}
            error={errors.region}
            required
          />

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: 'white' 
            }}>
              Environment *
            </label>
            <select
              value={formData.environment}
              onChange={(e) => handleInputChange('environment', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #495057',
                backgroundColor: '#2c2e33',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
              <option value="test">Test</option>
            </select>
          </div>
        </Group>

        {/* SSH Configuration */}
        <TextInput
          label="Bastion Host IP/Hostname"
          placeholder="e.g., 3.123.45.67"
          value={formData.sshHost}
          onChange={(e) => handleInputChange('sshHost', e.target.value)}
          error={errors.sshHost}
          required
        />

        <Group grow>
          <TextInput
            label="SSH Username"
            placeholder="ubuntu, ec2-user, etc."
            value={formData.sshUsername}
            onChange={(e) => handleInputChange('sshUsername', e.target.value)}
            error={errors.sshUsername}
            required
          />

          <NumberInput
            label="SSH Port"
            value={Number(formData.sshPort)}
            onChange={(value) => handleInputChange('sshPort', value?.toString() || '22')}
            error={errors.sshPort}
            min={1}
            max={65535}
            required
          />
        </Group>

        {/* PEM File */}
        <FileInput
          label="PEM File"
          placeholder="Upload your .pem key file"
          accept=".pem"
          onChange={handlePemFileUpload}
          error={errors.pemFileContent}
          leftSection={<IconUpload size={16} />}
          required
        />

        {/* Kubeconfig */}
        <Textarea
          label="Kubeconfig"
          placeholder="Paste your kubeconfig content here..."
          value={formData.kubeconfigContent}
          onChange={(e) => handleInputChange('kubeconfigContent', e.target.value)}
          error={errors.kubeconfigContent}
          rows={8}
          required
        />

        {/* Test Result */}
        {testResult && (
          <Alert
            icon={testResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={testResult.success ? 'green' : 'red'}
            title={testResult.success ? 'Connection Successful' : 'Connection Failed'}
          >
            {testResult.message}
          </Alert>
        )}

        {/* Actions */}
        <Group justify="space-between" mt="md">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            Test Connection
          </Button>

          <Group>
            <Button variant="subtle" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || (testResult !== null && !testResult.success)}
            >
              Add Cluster
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ClusterSetup;
