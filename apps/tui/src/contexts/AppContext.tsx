import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { BackendClient } from "../hooks/useBackend.js";
import type { TableInfo, QueryResult, ConnectRequest } from "../types/index.js";
import type { PanelType } from "../hooks/usePanelFocus.js";

/**
 * Connection information stored after successful login
 */
export interface ConnectionInfo {
  host: string;
  port: number;
  database: string;
  user: string;
}

/**
 * Global application state
 */
interface AppState {
  // Connection
  connection: ConnectionInfo | null;
  latency: number | null;

  // Database schema
  tables: TableInfo[];
  selectedTable: TableInfo | null;
  selectedSchema: string | null;

  // View state
  activePanel: PanelType;
  isQueryPanelOpen: boolean;

  // Query state
  queryResult: QueryResult | null;
  isExecuting: boolean;
  queryError: string | null;

  // Loading states
  isLoadingTables: boolean;
  isLoadingData: boolean;
}

/**
 * Context actions available to consumers
 */
interface AppContextValue extends AppState {
  backend: BackendClient;
  
  // Connection actions
  setConnection: (info: ConnectionInfo) => void;
  setLatency: (ms: number) => void;
  
  // Schema actions
  setTables: (tables: TableInfo[]) => void;
  selectTable: (table: TableInfo | null) => void;
  selectSchema: (schema: string | null) => void;
  
  // View actions
  setActivePanel: (panel: PanelType) => void;
  openQueryPanel: () => void;
  closeQueryPanel: () => void;
  toggleQueryPanel: () => void;
  
  // Query actions
  setQueryResult: (result: QueryResult | null) => void;
  setIsExecuting: (executing: boolean) => void;
  setQueryError: (error: string | null) => void;
  
  // Loading actions
  setIsLoadingTables: (loading: boolean) => void;
  setIsLoadingData: (loading: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  backend: BackendClient;
  initialConnection?: ConnectionInfo;
  children: ReactNode;
}

/**
 * Global app state provider
 * Wraps the entire application after successful connection
 */
export const AppProvider: React.FC<AppProviderProps> = ({
  backend,
  initialConnection,
  children,
}) => {
  // Connection state
  const [connection, setConnection] = useState<ConnectionInfo | null>(initialConnection ?? null);
  const [latency, setLatency] = useState<number | null>(null);

  // Database schema state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  // View state
  const [activePanel, setActivePanel] = useState<PanelType>("tree");
  const [isQueryPanelOpen, setIsQueryPanelOpen] = useState(false);

  // Query state
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Loading states
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Actions
  const selectTable = useCallback((table: TableInfo | null) => {
    setSelectedTable(table);
    if (table) {
      setSelectedSchema(table.schema);
    }
  }, []);

  const selectSchema = useCallback((schema: string | null) => {
    setSelectedSchema(schema);
  }, []);

  const openQueryPanel = useCallback(() => {
    setIsQueryPanelOpen(true);
    setActivePanel("query");
  }, []);

  const closeQueryPanel = useCallback(() => {
    setIsQueryPanelOpen(false);
    setActivePanel("tree");
  }, []);

  const toggleQueryPanel = useCallback(() => {
    if (isQueryPanelOpen) {
      closeQueryPanel();
    } else {
      openQueryPanel();
    }
  }, [isQueryPanelOpen, openQueryPanel, closeQueryPanel]);

  const value: AppContextValue = {
    // State
    backend,
    connection,
    latency,
    tables,
    selectedTable,
    selectedSchema,
    activePanel,
    isQueryPanelOpen,
    queryResult,
    isExecuting,
    queryError,
    isLoadingTables,
    isLoadingData,

    // Actions
    setConnection,
    setLatency,
    setTables,
    selectTable,
    selectSchema,
    setActivePanel,
    openQueryPanel,
    closeQueryPanel,
    toggleQueryPanel,
    setQueryResult,
    setIsExecuting,
    setQueryError,
    setIsLoadingTables,
    setIsLoadingData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook to access app context
 * Must be used within AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

/**
 * Hook to access only connection info (lighter weight)
 */
export function useConnection() {
  const { connection, latency, setLatency } = useApp();
  return { connection, latency, setLatency };
}

/**
 * Hook to access database schema state
 */
export function useSchema() {
  const {
    tables,
    selectedTable,
    selectedSchema,
    setTables,
    selectTable,
    selectSchema,
    isLoadingTables,
    setIsLoadingTables,
  } = useApp();

  return {
    tables,
    selectedTable,
    selectedSchema,
    setTables,
    selectTable,
    selectSchema,
    isLoadingTables,
    setIsLoadingTables,
  };
}

/**
 * Hook to access query state
 */
export function useQuery() {
  const {
    backend,
    queryResult,
    isExecuting,
    queryError,
    setQueryResult,
    setIsExecuting,
    setQueryError,
  } = useApp();

  return {
    backend,
    queryResult,
    isExecuting,
    queryError,
    setQueryResult,
    setIsExecuting,
    setQueryError,
  };
}

export default AppContext;
