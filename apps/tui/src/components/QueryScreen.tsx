import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import TextInput from "ink-text-input";
import Divider from "ink-divider";
import type { QueryResult, TableInfo } from "../types/index.js";
import { BackendClient } from "../hooks/useBackend.js";
import { ResultsTable } from "./ResultsTable.js";
import { TableBrowser } from "./TableBrowser.js";

interface QueryScreenProps {
  backend: BackendClient;
  onDisconnect: () => void;
}

export const QueryScreen: React.FC<QueryScreenProps> = ({ backend, onDisconnect }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const terminalWidth = stdout.columns || 80;
  const [query, setQuery] = useState("SELECT * FROM ");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [showTableBrowser, setShowTableBrowser] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  // Load tables on mount
  const loadTables = useCallback(async () => {
    setIsLoadingTables(true);
    try {
      const response = await backend.send({ type: "getTables" });
      if (response.type === "tables") {
        setTables(response.payload);
        setError(null);
      } else if (response.type === "error") {
        setError(`Failed to load tables: ${response.payload.message}`);
      }
    } catch (err) {
      setError(`Error loading tables: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingTables(false);
    }
  }, [backend]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Reset scroll when new results arrive
  useEffect(() => {
    setScrollY(0);
    setScrollX(0);
  }, [result]);

  const executeQuery = useCallback(async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setError(null);

    try {
      const response = await backend.send({ type: "execute", payload: { query } });

      if (response.type === "queryResult") {
        setResult(response.payload);
        if (!history.includes(query)) {
          setHistory((prev) => [...prev, query]);
        }
      } else if (response.type === "error") {
        setError(response.payload.message);
        setResult(null);
      }
    } catch (err) {
      setError(`Execution failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExecuting(false);
      setHistoryIndex(-1);
    }
  }, [query, backend, history]);

  const handleTableSelect = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 100`);
    setShowTableBrowser(false);
  };

  // All input handling lives here — no useInput in child components
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
    if (key.ctrl && input === "d") {
      onDisconnect();
    }
    if (key.ctrl && input === "t") {
      setShowTableBrowser((prev) => !prev);
    }
    if (key.ctrl && input === "e") {
      executeQuery();
    }
    if (key.ctrl && input === "r") {
      loadTables();
    }

    // Arrow keys: navigate history when typing, scroll results when there are results
    if (result && result.rows.length > 0) {
      if (key.upArrow) {
        setScrollY((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setScrollY((prev) => Math.min(result.rows.length - 1, prev + 1));
        return;
      }
      if (key.leftArrow) {
        setScrollX((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.rightArrow) {
        setScrollX((prev) => Math.min(result.columns.length - 1, prev + 1));
        return;
      }
    }

    // Fallback: arrow keys navigate query history
    if (key.upArrow && history.length > 0) {
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      const historyQuery = history[history.length - 1 - newIndex];
      if (historyQuery) {
        setQuery(historyQuery);
      }
    }
    if (key.downArrow && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const historyQuery = history[history.length - 1 - newIndex];
      if (historyQuery) {
        setQuery(historyQuery);
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box paddingX={1}>
        <Text color="cyan" bold>
          Keryx
        </Text>
        <Text color="gray"> | </Text>
        <Text color="green">Connected</Text>
        <Text color="gray">
          {" "}
          | Ctrl+T: Tables | Ctrl+E: Execute | Ctrl+D: Disconnect | Ctrl+C: Quit
        </Text>
      </Box>

      <Divider />

      <Box flexDirection="row" flexGrow={1}>
        {/* Table Browser Sidebar */}
        {showTableBrowser && terminalWidth >= 60 && (
          <Box width={Math.min(30, Math.floor(terminalWidth * 0.3))} flexDirection="column" borderStyle="single" marginRight={1}>
            <Box paddingX={1}>
              <Text bold>Tables (Ctrl+R to refresh)</Text>
            </Box>
            <TableBrowser tables={tables} onSelect={handleTableSelect} isLoading={isLoadingTables} />
          </Box>
        )}

        {/* Main Content */}
        <Box flexDirection="column" flexGrow={1}>
          {/* Query Input */}
          <Box flexDirection="column" paddingX={1}>
            <Text color="yellow">Query:</Text>
            <Box>
              <TextInput value={query} onChange={setQuery} placeholder="Enter SQL query..." />
            </Box>
          </Box>

          {/* Status */}
          {isExecuting && (
            <Box paddingX={1}>
              <Text color="blue">Executing...</Text>
            </Box>
          )}

          {error && (
            <Box paddingX={1}>
              <Text color="red">{error}</Text>
            </Box>
          )}

          {/* Results */}
          {result && (
            <Box flexDirection="column" flexGrow={1} paddingX={1}>
              <Box marginBottom={1}>
                <Text color="green">
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
                </Text>
              </Box>
              <ResultsTable result={result} scrollY={scrollY} scrollX={scrollX} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
