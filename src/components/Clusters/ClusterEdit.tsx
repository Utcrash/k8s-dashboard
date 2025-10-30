import React, { useState, useEffect } from 'react';
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
import { ClusterFormData, ClusterFormErrors, ClusterConfig, ClusterSummary } from '../../types/cluster';

interface ClusterEditProps {
  opened: boolean;
  onClose: () => void;
  cluster: ClusterSummary | null;
}

const ClusterEdit: React.FC<ClusterEditProps> = ({ opened, onClose, cluster }) => {
  const { updateCluster, testClusterConnection } = useCluster();
  
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
  const [originalClusterData, setOriginalClusterData] = useState<ClusterConfig | null>(null);

  // Load cluster data when modal opens
  useEffect(() => {
    if (opened && cluster) {
      loadClusterData(cluster.id);
    }
  }, [opened, cluster]);

  const loadClusterData = async (clusterId: string) => {
    setIsLoading(true);
    try {
      // Fetch full cluster data including sensitive information
      const response = await fetch(`http://localhost:3001/api/clusters/${clusterId}/full`);
      const data = await response.json();
      
      if (data.success && data.cluster) {
        const clusterData = data.cluster;
        
        // Populate form with existing cluster data
        setFormData({
          name: clusterData.name || '',
          region: clusterData.region || '',
          environment: clusterData.environment || 'dev',
          sshHost: clusterData.sshConfig?.host || '',
          sshUsername: clusterData.sshConfig?.username || 'ubuntu',
          sshPort: clusterData.sshConfig?.port?.toString() || '22',
          pemFileContent: '', // Don't populate - user can upload new one if needed
          kubeconfigContent: '', // Don't populate - user can upload new one if needed
        });
        
        // Store original data for comparison and fallback
        setOriginalClusterData(clusterData);
      }
    } catch (error) {
      console.error('Error loading cluster data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    } else {
      // Clear content if no file selected
      setFormData(prev => ({ ...prev, pemFileContent: '' }));
    }
  };

  const handleKubeconfigUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, kubeconfigContent: content }));
        setErrors(prev => ({ ...prev, kubeconfigContent: undefined }));
      };
      reader.readAsText(file);
    } else {
      // Clear content if no file selected
      setFormData(prev => ({ ...prev, kubeconfigContent: '' }));
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

    // Only require PEM and kubeconfig if they weren't previously set or user wants to change them
    if (!formData.pemFileContent.trim() && !originalClusterData?.sshConfig?.pemFile) {
      newErrors.pemFileContent = 'PEM file is required';
    }
    if (!formData.kubeconfigContent.trim() && !originalClusterData?.kubeconfig) {
      newErrors.kubeconfigContent = 'Kubeconfig is required';
    }

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
        id: formData.name.trim(),
        name: formData.name.trim(),
        region: formData.region,
        environment: formData.environment,
        sshConfig: {
          host: formData.sshHost,
          username: formData.sshUsername,
          port: Number(formData.sshPort),
          pemFile: formData.pemFileContent ? 
            btoa(formData.pemFileContent) : 
            originalClusterData?.sshConfig?.pemFile || '',
        },
        kubeconfig: formData.kubeconfigContent ? 
          btoa(formData.kubeconfigContent) : 
          originalClusterData?.kubeconfig || '',
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
    if (!validateForm() || !cluster) return;

    setIsLoading(true);

    try {
      const config: ClusterConfig = {
        id: formData.name.trim(),
        name: formData.name.trim(),
        region: formData.region,
        environment: formData.environment,
        sshConfig: {
          host: formData.sshHost,
          username: formData.sshUsername,
          port: Number(formData.sshPort),
          pemFile: formData.pemFileContent ? 
            btoa(formData.pemFileContent) : 
            originalClusterData?.sshConfig?.pemFile || '',
        },
        kubeconfig: formData.kubeconfigContent ? 
          btoa(formData.kubeconfigContent) : 
          originalClusterData?.kubeconfig || '',
      };

      await updateCluster(cluster.id, config);
      
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
      setOriginalClusterData(null);
      onClose();
    } catch (error) {
      console.error('Failed to update cluster:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
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
    setOriginalClusterData(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Cluster Configuration"
      size="lg"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        {/* Cluster Name */}
        <TextInput
          label="Cluster Name"
          placeholder="Enter cluster name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
        />

        {/* Region */}
        <TextInput
          label="Region"
          placeholder="e.g., us-west-2, ap-south-1"
          value={formData.region}
          onChange={(e) => handleInputChange('region', e.target.value)}
          error={errors.region}
          required
        />

        {/* Environment */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
            Environment <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={formData.environment}
            onChange={(e) => handleInputChange('environment', e.target.value)}
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

        {/* SSH Configuration */}
        <TextInput
          label="SSH Host"
          placeholder="Bastion host IP or hostname"
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
            placeholder="22"
            value={formData.sshPort}
            onChange={(value) => handleInputChange('sshPort', value?.toString() || '')}
            error={errors.sshPort}
            min={1}
            max={65535}
            required
          />
        </Group>

        {/* PEM File Upload or Paste */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
            PEM File {!originalClusterData?.sshConfig?.pemFile && <span style={{ color: 'red' }}>*</span>}
          </label>
          <p style={{ fontSize: '12px', color: '#868e96', margin: '0 0 8px 0' }}>
            {originalClusterData?.sshConfig?.pemFile ? (
              <>
                <span style={{ color: '#51cf66' }}>✓ Existing PEM file available.</span> Leave empty to keep it, or provide new content to replace it.
              </>
            ) : (
              "Upload a file or paste the SSH private key content"
            )}
          </p>
          
          <Group gap="xs" mb="xs">
            <FileInput
              placeholder="Upload PEM file"
              accept=".pem,.key"
              leftSection={<IconUpload size={16} />}
              onChange={handlePemFileUpload}
              style={{ flex: 1 }}
            />
          </Group>
          
          <Textarea
            placeholder="Or paste your PEM file content here..."
            value={formData.pemFileContent}
            onChange={(e) => handleInputChange('pemFileContent', e.target.value)}
            minRows={4}
            maxRows={8}
            style={{
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '12px',
            }}
          />
          
          {errors.pemFileContent && (
            <div style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>
              {errors.pemFileContent}
            </div>
          )}
        </div>

        {/* Kubeconfig Upload or Paste */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
            Kubeconfig {!originalClusterData?.kubeconfig && <span style={{ color: 'red' }}>*</span>}
          </label>
          <p style={{ fontSize: '12px', color: '#868e96', margin: '0 0 8px 0' }}>
            {originalClusterData?.kubeconfig ? (
              <>
                <span style={{ color: '#51cf66' }}>✓ Existing kubeconfig available.</span> Leave empty to keep it, or provide new content to replace it.
              </>
            ) : (
              "Upload a file or paste the kubeconfig content"
            )}
          </p>
          
          <Group gap="xs" mb="xs">
            <FileInput
              placeholder="Upload kubeconfig file"
              accept=".yaml,.yml,.config"
              leftSection={<IconUpload size={16} />}
              onChange={handleKubeconfigUpload}
              style={{ flex: 1 }}
            />
          </Group>
          
          <Textarea
            placeholder="Or paste your kubeconfig content here..."
            value={formData.kubeconfigContent}
            onChange={(e) => handleInputChange('kubeconfigContent', e.target.value)}
            minRows={6}
            maxRows={12}
            style={{
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '12px',
            }}
          />
          
          {errors.kubeconfigContent && (
            <div style={{ color: '#fa5252', fontSize: '12px', marginTop: '4px' }}>
              {errors.kubeconfigContent}
            </div>
          )}
        </div>

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
            <Button variant="subtle" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || (testResult !== null && !testResult.success)}
            >
              Update Cluster
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ClusterEdit;
