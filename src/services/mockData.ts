// Temporary mock data for testing - can be easily removed

export const mockNamespaces = [
  { metadata: { name: 'appveen' } },
  { metadata: { name: 'test-namespace' } },
  { metadata: { name: 'production' } },
  { metadata: { name: 'staging' } },
  { metadata: { name: 'default' } },
];

export const mockPods = [
  // appveen namespace pods
  {
    metadata: {
      name: 'web-app-1',
      namespace: 'appveen',
      creationTimestamp: '2024-01-15T10:30:00Z'
    },
    spec: {
      containers: [{ name: 'web-container', image: 'nginx:1.21' }],
      nodeName: 'node-1'
    },
    status: {
      phase: 'Running',
      podIP: '10.244.1.5'
    }
  },
  {
    metadata: {
      name: 'api-server-2',
      namespace: 'appveen',
      creationTimestamp: '2024-01-15T11:00:00Z'
    },
    spec: {
      containers: [{ name: 'api-container', image: 'node:18-alpine' }],
      nodeName: 'node-2'
    },
    status: {
      phase: 'Running',
      podIP: '10.244.1.6'
    }
  },
  // test-namespace pods
  {
    metadata: {
      name: 'test-pod-1',
      namespace: 'test-namespace',
      creationTimestamp: '2024-01-16T09:15:00Z'
    },
    spec: {
      containers: [{ name: 'test-container', image: 'busybox:latest' }],
      nodeName: 'node-1'
    },
    status: {
      phase: 'Running',
      podIP: '10.244.2.3'
    }
  },
  {
    metadata: {
      name: 'debug-pod',
      namespace: 'test-namespace',
      creationTimestamp: '2024-01-16T10:00:00Z'
    },
    spec: {
      containers: [{ name: 'debug-container', image: 'alpine:latest' }],
      nodeName: 'node-2'
    },
    status: {
      phase: 'Pending',
      podIP: null
    }
  },
  // production namespace pods
  {
    metadata: {
      name: 'prod-web-1',
      namespace: 'production',
      creationTimestamp: '2024-01-10T08:00:00Z'
    },
    spec: {
      containers: [{ name: 'web', image: 'nginx:1.22' }],
      nodeName: 'node-3'
    },
    status: {
      phase: 'Running',
      podIP: '10.244.3.10'
    }
  }
];

export const mockDeployments = [
  // appveen namespace deployments
  {
    metadata: {
      name: 'web-deployment',
      namespace: 'appveen',
      creationTimestamp: '2024-01-15T10:00:00Z'
    },
    spec: {
      replicas: 3,
      selector: { matchLabels: { app: 'web' } },
      template: {
        metadata: { labels: { app: 'web' } },
        spec: {
          containers: [{ name: 'web', image: 'nginx:1.21' }]
        }
      }
    },
    status: {
      readyReplicas: 3,
      replicas: 3,
      availableReplicas: 3
    }
  },
  {
    metadata: {
      name: 'api-deployment',
      namespace: 'appveen',
      creationTimestamp: '2024-01-15T10:30:00Z'
    },
    spec: {
      replicas: 2,
      selector: { matchLabels: { app: 'api' } },
      template: {
        metadata: { labels: { app: 'api' } },
        spec: {
          containers: [{ name: 'api', image: 'node:18-alpine' }]
        }
      }
    },
    status: {
      readyReplicas: 2,
      replicas: 2,
      availableReplicas: 2
    }
  },
  // test-namespace deployments
  {
    metadata: {
      name: 'test-deployment',
      namespace: 'test-namespace',
      creationTimestamp: '2024-01-16T09:00:00Z'
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'test' } },
      template: {
        metadata: { labels: { app: 'test' } },
        spec: {
          containers: [{ name: 'test', image: 'busybox:latest' }]
        }
      }
    },
    status: {
      readyReplicas: 1,
      replicas: 1,
      availableReplicas: 1
    }
  },
  // production namespace deployments
  {
    metadata: {
      name: 'prod-web-deployment',
      namespace: 'production',
      creationTimestamp: '2024-01-10T07:30:00Z'
    },
    spec: {
      replicas: 5,
      selector: { matchLabels: { app: 'prod-web' } },
      template: {
        metadata: { labels: { app: 'prod-web' } },
        spec: {
          containers: [{ name: 'web', image: 'nginx:1.22' }]
        }
      }
    },
    status: {
      readyReplicas: 5,
      replicas: 5,
      availableReplicas: 5
    }
  }
];

export const mockServices = [
  {
    metadata: { name: 'web-service', namespace: 'appveen' },
    spec: { type: 'ClusterIP', ports: [{ port: 80, targetPort: 80 }] }
  },
  {
    metadata: { name: 'test-service', namespace: 'test-namespace' },
    spec: { type: 'NodePort', ports: [{ port: 8080, targetPort: 8080 }] }
  },
  {
    metadata: { name: 'prod-service', namespace: 'production' },
    spec: { type: 'LoadBalancer', ports: [{ port: 443, targetPort: 443 }] }
  }
];

export const mockConfigMaps = [
  {
    metadata: { name: 'app-config', namespace: 'appveen' },
    data: { 'config.json': '{"env": "development"}' }
  },
  {
    metadata: { name: 'test-config', namespace: 'test-namespace' },
    data: { 'test.conf': 'debug=true' }
  }
];

export const mockServiceAccounts = [
  {
    metadata: { name: 'default', namespace: 'appveen' }
  },
  {
    metadata: { name: 'test-sa', namespace: 'test-namespace' }
  }
];

export const mockSecrets = [
  {
    metadata: { name: 'app-secret', namespace: 'appveen' },
    type: 'Opaque'
  },
  {
    metadata: { name: 'test-secret', namespace: 'test-namespace' },
    type: 'kubernetes.io/tls'
  }
];

// Helper function to filter data by namespace
export const getDataForNamespace = (data: any[], namespace: string) => {
  return data.filter(item => item.metadata.namespace === namespace);
};

// Simulate API delay
export const simulateApiDelay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
