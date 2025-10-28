import { useParams, useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'default';

/**
 * Hook to get and set the global namespace from the URL
 * This must be used within a Router context
 */
export const useGlobalNamespace = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // The global namespace is derived from the URL
  const globalNamespace = namespace || DEFAULT_NAMESPACE;

  // Function to change namespace by navigating to a new URL
  const setGlobalNamespace = (newNamespace: string) => {
    // Get current resource from the URL (deployments, pods, services, etc.)
    const currentResource = location.pathname.split('/').pop();
    
    // List of valid resources
    const validResources = ['deployments', 'pods', 'services', 'configmaps', 'serviceaccounts', 'secrets'];
    
    // If we're currently on a valid resource page, maintain that resource
    if (validResources.includes(currentResource || '')) {
      navigate(`/${newNamespace}/${currentResource}`);
    } else {
      // Default to deployments if not on a valid resource page
      navigate(`/${newNamespace}/deployments`);
    }
  };

  return { globalNamespace, setGlobalNamespace };
};

