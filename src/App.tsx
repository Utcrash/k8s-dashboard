import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import Layout from './components/Layout/Layout';
import PodsPage from './pages/PodsPage';
import PodDetailPage from './pages/PodDetailPage';
import ServicesPage from './pages/ServicesPage';
import NamespacesPage from './pages/NamespacesPage';
import ConfigMapsPage from './pages/ConfigMapsPage';
import ServiceAccountsPage from './pages/ServiceAccountsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import SecretsPage from './pages/SecretsPage';
import { NamespaceProvider } from './context/NamespaceContext';
import { ClusterProvider } from './context/ClusterContext';
import { useLocation } from 'react-router-dom';
import ScaleDeploymentModal from './components/Deployments/ScaleDeploymentModal';
import './App.css';

// Create a dark theme with custom primary color
const theme = createTheme({
  primaryColor: 'customBlue',
  colors: {
    customBlue: [
      '#e8eef7',
      '#d1ddef',
      '#a3b9d9',
      '#7394c3',
      '#4a73b0',
      '#3b5aaa', // rgb(59, 90, 170) - primary main
      '#2f4788',
      '#233566',
      '#172344',
      '#0b1122',
    ],
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  fontFamily:
    '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

// Get the base URL from the environment or default to /k8s
const BASE_URL = '/k8s';

// Define modals
const modals = {
  // Register the scale deployment modal
  scaleDeployment: ScaleDeploymentModal,
};

function App() {
  return (
    <>
      <ColorSchemeScript />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications />
        <ModalsProvider modals={modals}>
          <ClusterProvider>
            <NamespaceProvider>
              <Router basename={BASE_URL}>
              <Layout>
                <Routes>
                  {/* Redirect root to default namespace deployments */}
                  <Route path="/" element={<Navigate to="/appveen/deployments" replace />} />
                  
                  {/* Namespace-based routes - reordered with deployments first */}
                  <Route path="/:namespace/deployments" element={<DeploymentsPage />} />
                  <Route path="/:namespace/pods" element={<PodsPage />} />
                  <Route
                    path="/:namespace/pods/:podNamespace/:name"
                    element={<PodDetailPage />}
                  />
                  <Route
                    path="/:namespace/pods/:podNamespace/:name/:tab"
                    element={<PodDetailPage />}
                  />
                  <Route path="/:namespace/services" element={<ServicesPage />} />
                  <Route path="/:namespace/configmaps" element={<ConfigMapsPage />} />
                  <Route
                    path="/:namespace/serviceaccounts"
                    element={<ServiceAccountsPage />}
                  />
                  <Route path="/:namespace/secrets" element={<SecretsPage />} />
                  
                  {/* Non-namespace routes */}
                  <Route path="/namespaces" element={<NamespacesPage />} />
                  
                  {/* Redirect any unmatched routes to default namespace deployments */}
                  <Route path="*" element={<Navigate to="/appveen/deployments" replace />} />
                </Routes>
              </Layout>
              </Router>
            </NamespaceProvider>
          </ClusterProvider>
        </ModalsProvider>
      </MantineProvider>
    </>
  );
}

export default App;
