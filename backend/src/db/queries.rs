use super::client::PgClient;
use super::types::{ColumnDetail, TableInfo, TableSchema};
use tokio_postgres::Error;

impl PgClient {
    /// Returns all user tables (including partitioned tables) in the connected database.
    ///
    /// Queries `pg_class` joined with `pg_namespace`, filtering out system schemas
    /// (`pg_catalog`, `information_schema`, `pg_toast`).
    ///
    /// Note: `row_count` is from `pg_class.reltuples` which is an **estimate**
    /// updated by `ANALYZE`, not an exact count.
    pub async fn get_tables(&self) -> Result<Vec<TableInfo>, Error> {
        let client = self.client.as_ref().expect("Not connected");

        let rows = client
            .query(
                "SELECT c.relname AS table_name,
                            n.nspname AS schema_name,
                            c.reltuples::bigint AS row_count
                     FROM pg_class c
                     JOIN pg_namespace n ON n.oid = c.relnamespace
                     WHERE c.relkind IN ('r', 'p')
                       AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                     ORDER BY n.nspname, c.relname",
                &[],
            )
            .await?;

        let tables = rows
            .iter()
            .map(|row| TableInfo {
                name: row.get(0),
                schema: row.get(1),
                row_count: row.get(2),
            })
            .collect();

        Ok(tables)
    }

    /// Returns the column schema for a given table in the `public` schema.
    ///
    /// Each column includes its name, data type, nullability, and default value.
    /// Results are ordered by `ordinal_position` (i.e. column order in the table).
    pub async fn get_table_schema(&self, table_name: &str) -> Result<TableSchema, Error> {
        let client = self.client.as_ref().expect("Not connected");

        let rows = client
            .query(
                "SELECT column_name,
                            data_type,
                            is_nullable,
                            column_default
                     FROM information_schema.columns
                     WHERE table_name = $1
                       AND table_schema = 'public'
                     ORDER BY ordinal_position",
                &[&table_name],
            )
            .await?;

        let columns = rows
            .iter()
            .map(|row| ColumnDetail {
                name: row.get(0),
                data_type: row.get(1),
                is_nullable: row.get::<_, String>(2) == "YES",
                column_default: row.get(3),
            })
            .collect();

        Ok(TableSchema {
            name: table_name.to_string(),
            schema: "public".to_string(),
            columns,
        })
    }
}
