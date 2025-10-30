import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Something went wrong"
          color="red"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </Button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
