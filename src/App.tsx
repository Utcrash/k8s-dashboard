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
import DashboardPage from './pages/DashboardPage';
import PodsPage from './pages/PodsPage';
import PodDetailPage from './pages/PodDetailPage';
import ServicesPage from './pages/ServicesPage';
import NamespacesPage from './pages/NamespacesPage';
import ConfigMapsPage from './pages/ConfigMapsPage';
import ServiceAccountsPage from './pages/ServiceAccountsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import TokenPage from './pages/TokenPage';
import SecretsPage from './pages/SecretsPage';
import { NamespaceProvider } from './context/NamespaceContext';
import ScaleDeploymentModal from './components/Deployments/ScaleDeploymentModal';
import './App.css';

// Create a theme
const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#3f51b5', // primary main
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1',
    ],
    pink: [
      '#fce4ec',
      '#f8bbd0',
      '#f48fb1',
      '#f06292',
      '#ec407a',
      '#f50057', // secondary main
      '#d81b60',
      '#c2185b',
      '#ad1457',
      '#880e4f',
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
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications />
        <ModalsProvider modals={modals}>
          <NamespaceProvider>
            <Router basename={BASE_URL}>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/pods" element={<PodsPage />} />
                  <Route
                    path="/pods/:namespace/:name"
                    element={<PodDetailPage />}
                  />
                  <Route
                    path="/pods/:namespace/:name/:tab"
                    element={<PodDetailPage />}
                  />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/namespaces" element={<NamespacesPage />} />
                  <Route path="/configmaps" element={<ConfigMapsPage />} />
                  <Route
                    path="/serviceaccounts"
                    element={<ServiceAccountsPage />}
                  />
                  <Route path="/deployments" element={<DeploymentsPage />} />
                  <Route path="/token" element={<TokenPage />} />
                  <Route path="/secrets" element={<SecretsPage />} />
                  {/* Redirect any unmatched routes to the dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          </NamespaceProvider>
        </ModalsProvider>
      </MantineProvider>
    </>
  );
}

export default App;
