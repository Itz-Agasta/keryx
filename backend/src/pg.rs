use tokio_postgres::{types::Type, Client, Error, NoTls, Row};

pub struct PgClient {
    client: Option<Client>,
}

impl PgClient {
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

    pub fn disconnect(&mut self) {
        self.client = None;
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

    pub async fn execute(&self, query: &str) -> Result<QueryResult, tokio_postgres::Error> {
        let client = self.client.as_ref().unwrap();
        Self::execute_statement(client, query).await
    }

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

// ── Data types ──

pub struct QueryResult {
    pub columns: Vec<ColumnInfo>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: i64,
}

pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
}

pub struct TableInfo {
    pub name: String,
    pub schema: String,
    pub row_count: i64,
}

pub struct TableSchema {
    pub name: String,
    pub schema: String,
    pub columns: Vec<ColumnDetail>,
}

pub struct ColumnDetail {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub column_default: Option<String>,
}

// ── Helpers ──

fn build_query_result(rows: Vec<Row>) -> QueryResult {
    let columns = if let Some(first_row) = rows.first() {
        first_row
            .columns()
            .iter()
            .map(|col| ColumnInfo {
                name: col.name().to_string(),
                data_type: col.type_().name().to_string(),
            })
            .collect()
    } else {
        vec![]
    };

    let result_rows: Vec<Vec<serde_json::Value>> = rows
        .iter()
        .map(|row| (0..row.len()).map(|i| pg_value_to_json(row, i)).collect())
        .collect();

    let row_count = result_rows.len() as i64;

    QueryResult {
        columns,
        rows: result_rows,
        row_count,
    }
}

fn pg_value_to_json(row: &Row, idx: usize) -> serde_json::Value {
    let ty = row.columns()[idx].type_();

    match *ty {
        // Boolean
        Type::BOOL => row
            .get::<_, Option<bool>>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),

        // Small integers
        Type::INT2 => row
            .get::<_, Option<i16>>(idx)
            .map(|v| serde_json::Value::from(v as i64))
            .unwrap_or(serde_json::Value::Null),

        // Integers
        Type::INT4 => row
            .get::<_, Option<i32>>(idx)
            .map(|v| serde_json::Value::from(v as i64))
            .unwrap_or(serde_json::Value::Null),

        // Big integers
        Type::INT8 => row
            .get::<_, Option<i64>>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),

        // Floats
        Type::FLOAT4 => row
            .get::<_, Option<f32>>(idx)
            .map(|v| serde_json::Value::from(v as f64))
            .unwrap_or(serde_json::Value::Null),

        // Doubles
        Type::FLOAT8 => row
            .get::<_, Option<f64>>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),

        // Numeric (arbitrary precision) — return as string to avoid precision loss
        Type::NUMERIC => row
            .get::<_, Option<String>>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),

        // JSON types — read as string then parse
        Type::JSON | Type::JSONB => row
            .get::<_, Option<String>>(idx)
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or(serde_json::Value::Null),

        // Binary
        Type::BYTEA => {
            let bytes: Option<Vec<u8>> = row.get(idx);
            bytes
                .map(|b| serde_json::Value::from(hex_encode(&b)))
                .unwrap_or(serde_json::Value::Null)
        }

        // Everything else — read as string
        _ => row
            .get::<_, Option<String>>(idx)
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2 + 2);
    s.push_str("\\x");
    for &b in bytes {
        use std::fmt::Write;
        let _ = write!(s, "{:02x}", b);
    }
    s
}

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
