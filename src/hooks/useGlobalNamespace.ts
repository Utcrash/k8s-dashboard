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
    // Get the current path segments
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Replace the namespace segment (first segment after base)
    if (pathSegments.length > 0) {
      pathSegments[0] = newNamespace;
      navigate(`/${pathSegments.join('/')}`);
    } else {
      // If no path, go to dashboard
      navigate(`/${newNamespace}/dashboard`);
    }
  };

  return { globalNamespace, setGlobalNamespace };
};

