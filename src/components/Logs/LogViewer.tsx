import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Badge,
} from '@mantine/core';
import {
  IconSearch,
  IconArrowDown,
  IconPlayerPause,
  IconPlayerPlay,
  IconX,
  IconReload,
  IconChevronUp,
  IconChevronDown,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [jsonFormatting, setJsonFormatting] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Find all matches in logs
  const matches = useMemo(() => {
    if (!searchTerm) return [];
    
    const allMatches: { logIndex: number; matchIndex: number }[] = [];
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    
    logs.forEach((log, logIndex) => {
      let match;
      let matchIndex = 0;
      while ((match = regex.exec(log)) !== null) {
        allMatches.push({ logIndex, matchIndex: matchIndex++ });
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });
    
    return allMatches;
  }, [logs, searchTerm, caseSensitive]);

  // Reset current match when search changes
  useEffect(() => {
    setCurrentMatchIndex(0);
    matchRefs.current = [];
  }, [searchTerm, caseSensitive]);

  // Auto-scroll to bottom when logs change (only if not searching)
  useEffect(() => {
    if (autoScroll && !isPaused && !searchTerm && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused, searchTerm]);

  // Scroll to current match
  useEffect(() => {
    if (matches.length > 0 && matchRefs.current[currentMatchIndex]) {
      const currentMatchElement = matchRefs.current[currentMatchIndex];
      if (currentMatchElement) {
        currentMatchElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        setAutoScroll(false);
      }
    }
  }, [currentMatchIndex, matches.length]);

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

  // Navigation functions
  const goToNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const goToPreviousMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setCurrentMatchIndex(0);
  };

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && matches.length > 0) {
      e.preventDefault();
      if (e.shiftKey) {
        goToPreviousMatch();
      } else {
        goToNextMatch();
      }
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  // Toggle streaming mode
  const handleStreamingToggle = () => {
    if (onStreamingToggle) {
      onStreamingToggle(!isStreaming);
    }
  };

  // Detect if a log line is JSON
  const isJsonLine = (text: string): boolean => {
    const trimmed = text.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  };

  // Format JSON with basic syntax highlighting
  const formatJsonLine = (text: string): React.ReactNode => {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Basic JSON syntax highlighting
      return formatted.split('\n').map((line, i) => (
        <div key={i} style={{ marginLeft: `${(line.match(/^ */)?.[0]?.length || 0) * 8}px` }}>
          {line.replace(/^ +/, '').split('').map((char, j) => {
            let color = '#d4d4d4'; // Default text color
            
            if (char === '"' || char === "'") color = '#ce9178'; // String quotes
            else if (char === '{' || char === '}' || char === '[' || char === ']') color = '#569cd6'; // Brackets
            else if (char === ':' || char === ',') color = '#d4d4d4'; // Punctuation
            else if (/\d/.test(char)) color = '#b5cea8'; // Numbers
            else if (char === 't' || char === 'f' || char === 'n') {
              // Check for boolean/null values
              const remaining = line.slice(j);
              if (remaining.startsWith('true') || remaining.startsWith('false') || remaining.startsWith('null')) {
                color = '#569cd6';
              }
            }
            
            return (
              <span key={j} style={{ color }}>
                {char}
              </span>
            );
          })}
        </div>
      ));
    } catch {
      return text;
    }
  };

  // Highlight matching text with current match tracking
  const highlightText = (text: string, logIndex: number): React.ReactNode => {
    // First check if we should format as JSON
    if (isJsonLine(text) && !searchTerm && jsonFormatting) {
      return formatJsonLine(text);
    }

    if (!searchTerm) return text;

    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
    const parts = text.split(regex);
    let matchCount = 0;

    return parts.map((part, i) => {
      const isMatch = regex.test(part);
      if (isMatch) {
        const globalMatchIndex = matches.findIndex(
          (match) => match.logIndex === logIndex && match.matchIndex === matchCount
        );
        const isCurrentMatch = globalMatchIndex === currentMatchIndex;
        matchCount++;

        return (
          <span
            key={i}
            ref={(el) => {
              if (globalMatchIndex >= 0) {
                matchRefs.current[globalMatchIndex] = el;
              }
            }}
            style={{
              backgroundColor: isCurrentMatch 
                ? 'rgba(255, 165, 0, 0.8)' // Orange for current match
                : 'rgba(255, 255, 0, 0.4)', // Yellow for other matches
              color: isCurrentMatch ? 'black' : 'inherit',
              fontWeight: isCurrentMatch ? 'bold' : 'normal',
              padding: '1px 2px',
              borderRadius: '2px',
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Paper shadow="xs" withBorder>
        <Group p="xs" justify="space-between">
          <Group>
            <IconSearch size="1rem" />
            <TextInput
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              size="xs"
              style={{ width: 300 }}
              rightSection={
                searchTerm ? (
                  <ActionIcon size="xs" onClick={clearSearch} variant="subtle">
                    <IconX size="0.8rem" />
                  </ActionIcon>
                ) : null
              }
            />
            
            {matches.length > 0 && (
              <>
                <Badge variant="light" color="blue" size="sm">
                  {currentMatchIndex + 1} of {matches.length}
                </Badge>
                
                <Group gap="xs">
                  <Tooltip label="Previous match (Shift+Enter)">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={goToPreviousMatch}
                      disabled={matches.length === 0}
                    >
                      <IconChevronUp size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Next match (Enter)">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={goToNextMatch}
                      disabled={matches.length === 0}
                    >
                      <IconChevronDown size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </>
            )}
            
            {searchTerm && matches.length === 0 && (
              <Badge variant="light" color="red" size="sm">
                No matches
              </Badge>
            )}
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
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <Text
                key={index}
                style={{
                  margin: 0,
                  padding: '2px 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'monospace',
                  color: '#d4d4d4',
                }}
              >
                {highlightText(log, index)}
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
