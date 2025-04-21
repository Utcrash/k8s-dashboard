import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import PodsPage from './pages/PodsPage';
import ServicesPage from './pages/ServicesPage';
import NamespacesPage from './pages/NamespacesPage';
import ConfigMapsPage from './pages/ConfigMapsPage';
import ServiceAccountsPage from './pages/ServiceAccountsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import { NamespaceProvider } from './context/NamespaceContext';
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

function App() {
  return (
    <>
      <ColorSchemeScript />
      <MantineProvider theme={theme} defaultColorScheme="light">
        <NamespaceProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/pods" element={<PodsPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/namespaces" element={<NamespacesPage />} />
                <Route path="/configmaps" element={<ConfigMapsPage />} />
                <Route
                  path="/serviceaccounts"
                  element={<ServiceAccountsPage />}
                />
                <Route path="/deployments" element={<DeploymentsPage />} />
              </Routes>
            </Layout>
          </Router>
        </NamespaceProvider>
      </MantineProvider>
    </>
  );
}

export default App;
