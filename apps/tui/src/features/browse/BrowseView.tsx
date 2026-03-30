import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useInput, useApp } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { MainLayout } from "../../layouts/MainLayout.js";
import { KeyboardHints } from "../../shared/components/KeyboardHints.js";
import { DatabaseTree } from "./components/DatabaseTree.js";
import { DataPanel } from "./components/DataPanel.js";
import { TableHeader } from "./components/TableHeader.js";
import { QueryPanel } from "../query/QueryPanel.js";
import { usePanelFocus, type PanelType } from "../../hooks/usePanelFocus.js";
import type { BackendClient } from "../../hooks/useBackend.js";
import type { TableInfo, QueryResult, ConnectionInfo } from "../../types/index.js";

interface BrowseViewProps {
  backend: BackendClient;
  connection: ConnectionInfo;
  onDisconnect: () => void;
}

/**
 * Main browse view - the default view after login
 * 
 * Features:
 * - Database tree navigation (left panel)
 * - Table data display (right panel)
 * - Query panel (bottom slide-in, press Q)
 * - Tab to switch focus between panels
 * - Keyboard navigation throughout
 */
export const BrowseView: React.FC<BrowseViewProps> = ({
  backend,
  connection,
  onDisconnect,
}) => {
  const { exit } = useApp();
  const { height } = useScreenSize();

  // Calculate visible rows for data panel (same calculation as DataPanel)
  // height - header(2) - footer(1) - panel borders(2) - table header(2) - separator(1) - padding
  const visibleRows = Math.max(5, height - 10);

  // Panel focus management
  const { activePanel, setActivePanel, focusNext } = usePanelFocus({
    initialPanel: "tree",
    panels: ["tree", "data"],
  });

  // Query panel state
  const [isQueryPanelOpen, setIsQueryPanelOpen] = useState(false);
  const [queryPanelHeight, setQueryPanelHeight] = useState(8);

  // Database schema state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  // Tree navigation state
  const [treeFocusedIndex, setTreeFocusedIndex] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(["database"])
  );

  // Table data state
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Data scroll state
  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  // Connection latency
  const [latency, setLatency] = useState<number | null>(null);

  // Load tables on mount
  const loadTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTablesError(null);

    const startTime = Date.now();
    try {
      const response = await backend.send({ type: "getTables" });
      setLatency(Date.now() - startTime);

      if (response.type === "tables") {
        setTables(response.payload);
        // Auto-expand first schema if tables exist
        if (response.payload.length > 0) {
          const firstSchema = response.payload[0]?.schema || "public";
          setExpandedNodes((prev) => new Set([...prev, `schema:${firstSchema}`]));
        }
      } else if (response.type === "error") {
        setTablesError(response.payload.message);
      }
    } catch (err) {
      setTablesError(err instanceof Error ? err.message : "Failed to load tables");
    } finally {
      setIsLoadingTables(false);
    }
  }, [backend]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Load table data when a table is selected
  const loadTableData = useCallback(async (table: TableInfo) => {
    setIsLoadingData(true);
    setDataError(null);
    setScrollY(0);
    setScrollX(0);

    try {
      const query = `SELECT * FROM ${table.schema}.${table.name} LIMIT 100`;
      const response = await backend.send({ type: "execute", payload: { query } });

      if (response.type === "queryResult") {
        setTableData(response.payload);
      } else if (response.type === "error") {
        setDataError(response.payload.message);
        setTableData(null);
      }
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Failed to load data");
      setTableData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [backend]);

  // Handle table selection
  const handleSelectTable = useCallback((table: TableInfo) => {
    setSelectedTable(table);
    loadTableData(table);
    setActivePanel("data");
  }, [loadTableData, setActivePanel]);

  // Handle tree node expand/collapse
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Query panel handlers
  const openQueryPanel = useCallback(() => {
    setIsQueryPanelOpen(true);
    setActivePanel("query");
  }, [setActivePanel]);

  const closeQueryPanel = useCallback(() => {
    setIsQueryPanelOpen(false);
    setActivePanel("tree");
  }, [setActivePanel]);

  // Keyboard input handling
  useInput((input, key) => {
    // Global shortcuts
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (key.ctrl && input === "d") {
      onDisconnect();
      return;
    }

    // Query panel shortcuts
    if (isQueryPanelOpen) {
      if (key.escape) {
        closeQueryPanel();
        return;
      }
      // Let QueryPanel handle its own input
      return;
    }

    // Tab to switch panels
    if (key.tab) {
      focusNext();
      return;
    }

    // Open query panel
    if (input === "q" || input === "Q") {
      openQueryPanel();
      return;
    }

    // Refresh tables
    if (input === "r" || input === "R") {
      loadTables();
      return;
    }

    // Tree panel navigation (only up/down - enter/expand handled by tree)
    if (activePanel === "tree") {
      if (key.upArrow) {
        setTreeFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setTreeFocusedIndex((prev) => prev + 1); // Will be clamped by tree
        return;
      }
      // Note: Enter, Left, Right are handled by DatabaseTree component directly
    }

    // Data panel navigation
    if (activePanel === "data" && tableData) {
      // Calculate max scroll - stop when last row is visible
      const maxScrollY = Math.max(0, tableData.rows.length - visibleRows);
      const maxScrollX = Math.max(0, tableData.columns.length - 1);
      
      if (key.upArrow) {
        setScrollY((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setScrollY((prev) => Math.min(maxScrollY, prev + 1));
        return;
      }
      if (key.leftArrow) {
        setScrollX((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.rightArrow) {
        setScrollX((prev) => Math.min(maxScrollX, prev + 1));
        return;
      }
    }
  });

  // Determine connection status
  const connectionStatus = useMemo(() => {
    if (latency === null) return "connecting";
    if (latency > 500) return "slow";
    return "online";
  }, [latency]);

  // Effective active panel (considers query panel)
  const effectivePanel: PanelType = isQueryPanelOpen ? "query" : activePanel;

  return (
    <MainLayout
      header={
        <TableHeader
          database={connection.database}
          host={connection.host}
          port={connection.port}
          user={connection.user}
          latency={latency ?? undefined}
          status={connectionStatus as "online" | "slow" | "connecting"}
        />
      }
      left={
        <DatabaseTree
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          isFocused={activePanel === "tree" && !isQueryPanelOpen}
          isLoading={isLoadingTables}
          focusedIndex={treeFocusedIndex}
          onFocusedIndexChange={setTreeFocusedIndex}
          onToggleExpand={handleToggleExpand}
          expandedNodes={expandedNodes}
          databaseName={connection.database}
        />
      }
      right={
        <DataPanel
          selectedTable={selectedTable}
          data={tableData}
          isLoading={isLoadingData}
          error={dataError}
          isFocused={activePanel === "data" && !isQueryPanelOpen}
          scrollY={scrollY}
          scrollX={scrollX}
          onScrollY={setScrollY}
          onScrollX={setScrollX}
        />
      }
      leftFocused={activePanel === "tree" && !isQueryPanelOpen}
      rightFocused={activePanel === "data" && !isQueryPanelOpen}
      bottom={
        <QueryPanel
          backend={backend}
          selectedTable={selectedTable}
          isOpen={isQueryPanelOpen}
          onClose={closeQueryPanel}
          isFocused={isQueryPanelOpen}
        />
      }
      showBottom={isQueryPanelOpen}
      bottomHeight={queryPanelHeight}
      footer={
        <KeyboardHints
          activePanel={effectivePanel}
          isQueryPanelOpen={isQueryPanelOpen}
        />
      }
    />
  );
};

export default BrowseView;
