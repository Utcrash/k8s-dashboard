import React, { createContext, useState, useContext, useEffect } from 'react';
import { getNamespaces } from '../services/k8sService';

interface NamespaceContextType {
  globalNamespace: string;
  setGlobalNamespace: React.Dispatch<React.SetStateAction<string>>;
  availableNamespaces: string[];
  isLoading: boolean;
  error: string | null;
  useGlobalNamespace: boolean;
  setUseGlobalNamespace: React.Dispatch<React.SetStateAction<boolean>>;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(
  undefined
);

export const NamespaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [globalNamespace, setGlobalNamespace] = useState<string>(
    process.env.K8S_NAMESPACE || 'appveen'
  );
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([
    'appveen',
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useGlobalNamespace, setUseGlobalNamespace] = useState<boolean>(true);

  useEffect(() => {
    const fetchNamespaces = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getNamespaces();
        const namespaceNames = response.items.map(
          (ns: any) => ns.metadata.name
        );
        setAvailableNamespaces(namespaceNames);

        // If the currently selected namespace isn't in the list, reset to default
        if (!namespaceNames.includes(globalNamespace)) {
          setGlobalNamespace('appveen');
        }
      } catch (err) {
        console.error('Error fetching namespaces:', err);
        setError('Failed to fetch namespaces');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNamespaces();
  }, [globalNamespace]);

  const value = {
    globalNamespace,
    setGlobalNamespace,
    availableNamespaces,
    isLoading,
    error,
    useGlobalNamespace,
    setUseGlobalNamespace,
  };

  return (
    <NamespaceContext.Provider value={value}>
      {children}
    </NamespaceContext.Provider>
  );
};

export const useNamespace = (): NamespaceContextType => {
  const context = useContext(NamespaceContext);
  if (context === undefined) {
    throw new Error('useNamespace must be used within a NamespaceProvider');
  }
  return context;
};
