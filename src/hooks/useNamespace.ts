import { useParams, useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_NAMESPACE = process.env.REACT_APP_K8S_NAMESPACE || 'appveen';

/**
 * Single namespace hook for the entire app
 */
export const useCurrentNamespace = () => {
  const params = useParams<{ namespace: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get namespace from URL path or use default
  // Extract namespace from pathname like "/production/pods" -> "production"
  const pathnameParts = location.pathname.split('/').filter(Boolean);
  const namespaceFromPath = pathnameParts[0];
  
  // Use params first, then pathname, then default
  const namespace = params.namespace || namespaceFromPath || DEFAULT_NAMESPACE;
  

  // Function to change namespace
  const setNamespace = (newNamespace: string) => {
    
    // Get current resource from URL
    const currentResource = location.pathname.split('/').pop();
    const validResources = ['deployments', 'pods', 'services', 'configmaps', 'serviceaccounts', 'secrets'];
    
    // Navigate to new namespace with same resource or default to deployments
    if (validResources.includes(currentResource || '')) {
      navigate(`/${newNamespace}/${currentResource}`);
    } else {
      navigate(`/${newNamespace}/deployments`);
    }
  };

  return { namespace, setNamespace };
};
