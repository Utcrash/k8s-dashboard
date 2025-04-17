import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Text,
  TextInput,
  Button,
  Box,
  Group,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Switch,
} from '@mantine/core';
import {
  IconFilter,
  IconArrowDown,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
  IconReload,
} from '@tabler/icons-react';

interface LogViewerProps {
  logs: string[];
  refreshLogs: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  onStreamingToggle?: (enabled: boolean) => void;
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  refreshLogs,
  isLoading = false,
  isStreaming = false,
  onStreamingToggle,
}) => {
  const [filter, setFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filteredLogs, setFilteredLogs] = useState<string[]>(logs);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Update filtered logs when logs or filter changes
  useEffect(() => {
    if (filter) {
      setFilteredLogs(
        logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
      );
    } else {
      setFilteredLogs(logs);
    }
  }, [logs, filter]);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll, isPaused]);

  // Handle scroll events
  const handleScroll = () => {
    if (!logContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

    setAutoScroll(isAtBottom);
  };

  // Toggle pause/resume logs
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      refreshLogs();
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  // Clear filter
  const clearFilter = () => {
    setFilter('');
  };

  // Toggle streaming mode
  const handleStreamingToggle = () => {
    if (onStreamingToggle) {
      onStreamingToggle(!isStreaming);
    }
  };

  // Highlight matching text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: 'rgba(255, 255, 100, 0.3)' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Paper shadow="xs" withBorder>
        <Group p="xs" justify="space-between">
          <Group>
            <IconFilter size="1rem" />
            <TextInput
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              size="xs"
              style={{ width: 300 }}
              rightSection={
                filter ? (
                  <ActionIcon size="xs" onClick={clearFilter} variant="subtle">
                    <IconX size="0.8rem" />
                  </ActionIcon>
                ) : null
              }
            />
          </Group>

          <Group>
            {onStreamingToggle && (
              <Switch
                checked={isStreaming}
                onChange={handleStreamingToggle}
                size="xs"
                label="Stream logs"
                color="blue"
              />
            )}

            <Tooltip label={isPaused ? 'Resume logs' : 'Pause logs'}>
              <ActionIcon
                onClick={togglePause}
                color={isPaused ? 'red' : 'gray'}
                variant="subtle"
                disabled={isStreaming && !isPaused}
              >
                {isPaused ? (
                  <IconPlayerPlay size="1.1rem" />
                ) : (
                  <IconPlayerPause size="1.1rem" />
                )}
              </ActionIcon>
            </Tooltip>

            {!isStreaming && (
              <Tooltip label="Refresh logs">
                <ActionIcon
                  onClick={refreshLogs}
                  color="blue"
                  variant="subtle"
                  loading={isLoading}
                >
                  <IconReload size="1.1rem" />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label="Scroll to bottom">
              <ActionIcon
                onClick={scrollToBottom}
                color={autoScroll ? 'blue' : 'gray'}
                variant="subtle"
              >
                <IconArrowDown size="1.1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <ScrollArea
          h="calc(100vh - 200px)"
          p="xs"
          bg="#1e1e1e"
          onScrollPositionChange={({ y }) => {
            const element = logContainerRef.current;
            if (element) {
              const isAtBottom =
                element.scrollHeight - y - element.clientHeight < 10;
              setAutoScroll(isAtBottom);
            }
          }}
          viewportRef={logContainerRef}
        >
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <Text
                key={index}
                style={{
                  margin: 0,
                  padding: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'monospace',
                  color: '#d4d4d4',
                }}
              >
                {filter ? highlightText(log, filter) : log}
              </Text>
            ))
          ) : (
            <Text ta="center" mt="md" c="dimmed">
              {isLoading
                ? 'Loading logs...'
                : isStreaming && logs.length === 0
                ? 'Waiting for logs...'
                : 'No logs available'}
            </Text>
          )}
        </ScrollArea>
      </Paper>
    </>
  );
};

export default LogViewer;
