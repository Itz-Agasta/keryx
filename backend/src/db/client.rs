use super::helpers::build_query_result;
use super::types::QueryResult;
use tokio_postgres::{Client, Error, NoTls};

pub struct PgClient {
    pub(crate) client: Option<Client>, // pub(crate) so queries.rs can access it
}

impl PgClient {
    /// Establishes a new PostgreSQL connection.
    ///
    /// Spawns a background task to handle the connection future. If the connection
    /// drops, the error is logged to stderr.
    ///
    /// # Arguments
    ///
    /// * `host` - PostgreSQL server hostname (e.g. `"localhost"`)
    /// * `port` - PostgreSQL server port (e.g. `5432`)
    /// * `database` - Database name to connect to
    /// * `user` - Username for authentication
    /// * `password` - Password for authentication
    pub async fn connect(
        host: &str,
        port: u16,
        database: &str,
        user: &str,
        password: &str,
    ) -> Result<Self, Error> {
        let conn_str = build_connection_string(host, port, database, user, password);
        let (client, connection) = tokio_postgres::connect(&conn_str, NoTls).await?;

        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Connection error: {}", e);
            }
        });

        Ok(PgClient {
            client: Some(client),
        })
    }

    /// Drops the underlying PostgreSQL connection.
    ///
    /// Subsequent calls to [`execute`](PgClient::execute) will panic until
    /// a new connection is established.
    pub fn disconnect(&mut self) {
        self.client = None;
    }

    /// Executes an arbitrary SQL statement.
    ///
    /// Uses a two-phase approach:
    /// 1. Try `client.query()` — works for SELECT and other row-returning statements
    /// 2. On failure (e.g. "no rows returned"), fall back to `client.execute()`
    ///    for INSERT/UPDATE/DELETE/DDL statements
    ///
    /// Returns a [`QueryResult`] with columns, rows, and row count.
    pub async fn execute(&self, query: &str) -> Result<QueryResult, tokio_postgres::Error> {
        let client = self
            .client
            .as_ref()
            .expect("PgClient::execute called after disconnect");
        Self::execute_statement(client, query).await
    }

    async fn execute_statement(
        client: &Client,
        query: &str,
    ) -> Result<QueryResult, tokio_postgres::Error> {
        match client.query(query, &[]).await {
            Ok(rows) => Ok(build_query_result(rows)),
            Err(_) => {
                let affected = client.execute(query, &[]).await?;
                Ok(QueryResult {
                    columns: vec![],
                    rows: vec![],
                    row_count: affected as i64,
                })
            }
        }
    }
}

/// Builds a PostgreSQL connection string from individual parameters.
///
/// Only includes non-empty/non-zero values. Format: `host=X port=Y dbname=Z user=W password=P`.
fn build_connection_string(
    host: &str,
    port: u16,
    database: &str,
    user: &str,
    password: &str,
) -> String {
    let mut parts = Vec::new();

    if !host.is_empty() {
        parts.push(format!("host={}", host));
    }
    if port > 0 {
        parts.push(format!("port={}", port));
    }
    if !database.is_empty() {
        parts.push(format!("dbname={}", database));
    }
    if !user.is_empty() {
        parts.push(format!("user={}", user));
    }
    if !password.is_empty() {
        parts.push(format!("password={}", password));
    }

    parts.join(" ")
}
