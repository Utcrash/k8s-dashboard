import { useParams, useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'appveen';

/**
 * Hook to get and set the global namespace from the URL
 * This must be used within a Router context
 */
export const useGlobalNamespace = () => {
  const params = useParams<{ namespace: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract namespace from URL path or use default
  // Extract namespace from pathname like "/production/pods" -> "production"
  const pathnameParts = location.pathname.split('/').filter(Boolean);
  const namespaceFromPath = pathnameParts[0];
  
  // Use params first, then pathname, then default
  const namespace = params.namespace || namespaceFromPath;
  
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
      const newPath = `/${newNamespace}/${currentResource}`;
      navigate(newPath);
    } else {
      // Default to deployments if not on a valid resource page
      const newPath = `/${newNamespace}/deployments`;
      navigate(newPath);
    }
  };

  return { globalNamespace, setGlobalNamespace };
};