import React, { createContext, useState, useContext, useEffect } from 'react';
import * as yaml from 'js-yaml';

export interface KubeConfig {
  id: string;
  name: string;
  config: any;
  server: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface KubeConfigContextType {
  configs: KubeConfig[];
  activeConfig: KubeConfig | null;
  addConfig: (name: string, configContent: string) => Promise<void>;
  removeConfig: (id: string) => void;
  setActiveConfig: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

const KubeConfigContext = createContext<KubeConfigContextType | undefined>(
  undefined
);

export const KubeConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [configs, setConfigs] = useState<KubeConfig[]>([]);
  const [activeConfig, setActiveConfigState] = useState<KubeConfig | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load configs from localStorage on mount
  useEffect(() => {
    const savedConfigs = localStorage.getItem('k8s_configs');
    const activeConfigId = localStorage.getItem('k8s_active_config');

    if (savedConfigs) {
      try {
        const parsedConfigs: KubeConfig[] = JSON.parse(savedConfigs);
        setConfigs(parsedConfigs);

        // Set active config
        if (activeConfigId) {
          const active = parsedConfigs.find((c) => c.id === activeConfigId);
          if (active) {
            setActiveConfigState(active);
          }
        } else if (parsedConfigs.length > 0) {
          // If no active config set, use the first one or default kubectl proxy
          const defaultConfig =
            parsedConfigs.find((c) => c.isDefault) || parsedConfigs[0];
          setActiveConfigState(defaultConfig);
          localStorage.setItem('k8s_active_config', defaultConfig.id);
        }
      } catch (err) {
        console.error('Error loading saved configs:', err);
        setError('Failed to load saved configurations');
      }
    } else {
      // Create default kubectl proxy config if no configs exist
      const defaultConfig: KubeConfig = {
        id: 'default-kubectl-proxy',
        name: 'Local kubectl proxy',
        config: null,
        server: 'http://localhost:8001',
        isActive: true,
        isDefault: true,
      };
      setConfigs([defaultConfig]);
      setActiveConfigState(defaultConfig);
      localStorage.setItem('k8s_configs', JSON.stringify([defaultConfig]));
      localStorage.setItem('k8s_active_config', defaultConfig.id);
    }
  }, []);

  const addConfig = async (
    name: string,
    configContent: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse the kubeconfig YAML
      const config = yaml.load(configContent) as any;

      if (!config || !config.clusters || !config.contexts || !config.users) {
        throw new Error('Invalid kubeconfig format');
      }

      // Extract server URL from the current context
      const currentContext = config.contexts.find(
        (ctx: any) => ctx.name === config['current-context']
      );

      if (!currentContext) {
        throw new Error('No current context found in kubeconfig');
      }

      const cluster = config.clusters.find(
        (c: any) => c.name === currentContext.context.cluster
      );

      if (!cluster) {
        throw new Error('Cluster not found for current context');
      }

      const newConfig: KubeConfig = {
        id: `config-${Date.now()}`,
        name,
        config,
        server: cluster.cluster.server,
        isActive: false,
      };

      const updatedConfigs = [...configs, newConfig];
      setConfigs(updatedConfigs);
      localStorage.setItem('k8s_configs', JSON.stringify(updatedConfigs));
    } catch (err: any) {
      setError(err.message || 'Failed to parse kubeconfig');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeConfig = (id: string) => {
    const configToRemove = configs.find((c) => c.id === id);
    if (configToRemove?.isDefault) {
      setError('Cannot remove default kubectl proxy configuration');
      return;
    }

    const updatedConfigs = configs.filter((c) => c.id !== id);
    setConfigs(updatedConfigs);
    localStorage.setItem('k8s_configs', JSON.stringify(updatedConfigs));

    // If removing active config, switch to default or first available
    if (activeConfig?.id === id) {
      const newActive =
        updatedConfigs.find((c) => c.isDefault) || updatedConfigs[0] || null;
      setActiveConfigState(newActive);
      if (newActive) {
        localStorage.setItem('k8s_active_config', newActive.id);
      } else {
        localStorage.removeItem('k8s_active_config');
      }
    }
  };

  const setActiveConfig = (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (config) {
      setActiveConfigState(config);
      localStorage.setItem('k8s_active_config', id);
      setError(null);
    }
  };

  const value = {
    configs,
    activeConfig,
    addConfig,
    removeConfig,
    setActiveConfig,
    isLoading,
    error,
  };

  return (
    <KubeConfigContext.Provider value={value}>
      {children}
    </KubeConfigContext.Provider>
  );
};

export const useKubeConfig = (): KubeConfigContextType => {
  const context = useContext(KubeConfigContext);
  if (context === undefined) {
    throw new Error('useKubeConfig must be used within a KubeConfigProvider');
  }
  return context;
};
