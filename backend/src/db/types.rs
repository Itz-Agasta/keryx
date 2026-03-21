/// Result of executing a SQL query.
///
/// For SELECT queries, `columns` and `rows` are populated.
/// For INSERT/UPDATE/DELETE/DDL, `columns` and `rows` are empty
/// and `row_count` reflects the number of affected rows.
pub struct QueryResult {
    pub columns: Vec<ColumnInfo>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: i64,
}

/// Metadata about a single column in a query result.
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
}

/// Information about a database table.
///
/// `row_count` is an estimate from `pg_class.reltuples` (updated by ANALYZE),
/// not an exact count.
pub struct TableInfo {
    pub name: String,
    pub schema: String,
    pub row_count: i64,
}

/// Full schema description for a table, including all columns.
pub struct TableSchema {
    pub name: String,
    pub schema: String,
    pub columns: Vec<ColumnDetail>,
}

/// Metadata about a single column in a table schema.
pub struct ColumnDetail {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub column_default: Option<String>,
}
