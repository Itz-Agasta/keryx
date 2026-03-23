use super::types::{ColumnInfo, QueryResult};
use tokio_postgres::{types::Type, Row};

/// Builds a PostgreSQL connection string from individual parameters.
///
/// Only includes non-empty/non-zero values. Format: `host=X port=Y dbname=Z user=W password=P`.
pub fn build_connection_string(
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

pub fn build_query_result(rows: Vec<Row>) -> QueryResult {
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

pub fn pg_value_to_json(row: &Row, idx: usize) -> serde_json::Value {
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
