export interface ConnectRequest {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface ExecuteRequest {
  query: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: unknown[][];
  rowCount: number;
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount?: number;
}

export interface ColumnDetail {
  name: string;
  dataType: string;
  isNullable: boolean;
  columnDefault?: string;
}

export interface TableSchema {
  name: string;
  schema: string;
  columns: ColumnDetail[];
}

export type Request =
  | { type: "connect"; payload: ConnectRequest }
  | { type: "disconnect" }
  | { type: "execute"; payload: ExecuteRequest }
  | { type: "getTables" }
  | { type: "getTableSchema"; payload: string }
  | { type: "ping" };

export type Response =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "queryResult"; payload: QueryResult }
  | { type: "tables"; payload: TableInfo[] }
  | { type: "tableSchema"; payload: TableSchema }
  | { type: "pong" }
  | { type: "error"; payload: { message: string } };
