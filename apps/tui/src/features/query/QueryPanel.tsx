import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { QueryResults } from "./components/QueryResults.js";
import { COLORS } from "../../shared/theme/colors.js";
import type { BackendClient } from "../../hooks/useBackend.js";
import type { TableInfo, QueryResult } from "../../types/index.js";

interface QueryPanelProps {
  backend: BackendClient;
  selectedTable: TableInfo | null;
  isOpen: boolean;
  onClose: () => void;
  isFocused: boolean;
}

/**
 * Query panel that slides in from the bottom
 * 
 * Features:
 * - SQL query input
 * - Query history navigation
 * - Compact results display
 * - Execute with Ctrl+Enter
 * - Clear with Ctrl+K
 * - Close with Esc
 */
export const QueryPanel: React.FC<QueryPanelProps> = ({
  backend,
  selectedTable,
  isOpen,
  onClose,
  isFocused,
}) => {
  // Query state
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | undefined>();

  // History state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!query.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();
    try {
      const response = await backend.send({
        type: "execute",
        payload: { query: query.trim() },
      });

      setExecutionTime(Date.now() - startTime);

      if (response.type === "queryResult") {
        setResult(response.payload);
        // Add to history if not duplicate
        if (!history.includes(query.trim())) {
          setHistory((prev) => [...prev.slice(-19), query.trim()]);
        }
      } else if (response.type === "error") {
        setError(response.payload.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query execution failed");
    } finally {
      setIsExecuting(false);
      setHistoryIndex(-1);
    }
  }, [query, backend, history, isExecuting]);

  // Clear query
  const clearQuery = useCallback(() => {
    setQuery("");
    setResult(null);
    setError(null);
    setHistoryIndex(-1);
  }, []);

  // Navigate history
  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (history.length === 0) return;

      if (direction === "up") {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setQuery(history[history.length - 1 - newIndex] || "");
      } else {
        const newIndex = Math.max(historyIndex - 1, -1);
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          setQuery("");
        } else {
          setQuery(history[history.length - 1 - newIndex] || "");
        }
      }
    },
    [history, historyIndex]
  );

  // Keyboard shortcuts
  useInput(
    (input, key) => {
      if (!isFocused || !isOpen) return;

      // Execute query with Ctrl+Enter
      if (key.ctrl && key.return) {
        executeQuery();
        return;
      }

      // Clear with Ctrl+K
      if (key.ctrl && input === "k") {
        clearQuery();
        return;
      }

      // History navigation
      if (key.upArrow) {
        navigateHistory("up");
        return;
      }
      if (key.downArrow) {
        navigateHistory("down");
        return;
      }
    },
    { isActive: isFocused && isOpen }
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isFocused ? COLORS.borderFocus : COLORS.border}
    >
      {/* Header bar */}
      <Box paddingX={1} justifyContent="space-between">
        <Box>
          <Text color={COLORS.primary} bold>
            SQL Query
          </Text>
          {selectedTable && (
            <Text color={COLORS.textMuted}>
              {" "}• Context: {selectedTable.schema}.{selectedTable.name}
            </Text>
          )}
        </Box>
        <Text color={COLORS.textMuted} dimColor>
          Esc to close
        </Text>
      </Box>

      {/* Separator */}
      <Box>
        <Text color={COLORS.border}>
          {"─".repeat(process.stdout.columns - 4 || 76)}
        </Text>
      </Box>

      {/* Content area - split between input and results */}
      <Box flexDirection="row" paddingX={1}>
        {/* Left: Query input */}
        <Box flexDirection="column" width="40%">
          <Box
            borderStyle="round"
            borderColor={COLORS.border}
            paddingX={1}
          >
            <TextInput
              value={query}
              onChange={setQuery}
              placeholder={
                selectedTable
                  ? `SELECT * FROM ${selectedTable.schema}.${selectedTable.name} LIMIT 10`
                  : "Enter SQL query..."
              }
              focus={isFocused}
            />
          </Box>
          <Box marginTop={1}>
            <Text color={COLORS.textMuted} dimColor>
              <Text color={COLORS.text}>Ctrl+Enter</Text> Execute
              <Text color={COLORS.textMuted}> • </Text>
              <Text color={COLORS.text}>Ctrl+K</Text> Clear
              {history.length > 0 && (
                <>
                  <Text color={COLORS.textMuted}> • </Text>
                  <Text color={COLORS.text}>↑↓</Text> History
                </>
              )}
            </Text>
          </Box>
        </Box>

        {/* Vertical separator */}
        <Box marginX={1}>
          <Text color={COLORS.border}>│</Text>
        </Box>

        {/* Right: Results */}
        <Box flexGrow={1}>
          <QueryResults
            result={result}
            error={error}
            isExecuting={isExecuting}
            executionTime={executionTime}
            maxRows={3}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default QueryPanel;
