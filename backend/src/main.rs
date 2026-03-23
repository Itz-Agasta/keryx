mod db;

use db::PgClient;
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, Write};

// Request types
#[derive(Deserialize)]
#[serde(tag = "type")]
enum Request {
    #[serde(rename = "connect")]
    Connect { payload: ConnectPayload },

    #[serde(rename = "disconnect")]
    Disconnect,

    #[serde(rename = "execute")]
    Execute { payload: ExecutePayload },

    #[serde(rename = "getTables")]
    GetTables,

    #[serde(rename = "getTableSchema")]
    GetTableSchema { payload: String },

    #[serde(rename = "ping")]
    Ping,
}

#[derive(Deserialize)]
struct ConnectPayload {
    host: String,
    port: u16,
    database: String,
    user: String,
    password: String,
}

#[derive(Deserialize)]
struct ExecutePayload {
    query: String,
}

// Response types
#[derive(Serialize)]
#[serde(tag = "type")]
enum Response {
    #[serde(rename = "connected")]
    Connected,

    #[serde(rename = "disconnected")]
    Disconnected,

    #[serde(rename = "pong")]
    Pong,

    #[serde(rename = "queryResult")]
    QueryResult {
        #[serde(skip_serializing_if = "Option::is_none")]
        payload: Option<QueryResultPayload>,
    },

    #[serde(rename = "tables")]
    Tables {
        #[serde(skip_serializing_if = "Option::is_none")]
        payload: Option<Vec<TableInfoPayload>>,
    },

    #[serde(rename = "tableSchema")]
    TableSchema {
        #[serde(skip_serializing_if = "Option::is_none")]
        payload: Option<TableSchemaPayload>,
    },

    #[serde(rename = "error")]
    Error { payload: ErrorPayload },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct QueryResultPayload {
    columns: Vec<ColumnInfoPayload>,
    rows: Vec<Vec<serde_json::Value>>,
    row_count: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ColumnInfoPayload {
    name: String,
    data_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TableInfoPayload {
    name: String,
    schema: String,
    row_count: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TableSchemaPayload {
    name: String,
    schema: String,
    columns: Vec<ColumnDetailPayload>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ColumnDetailPayload {
    name: String,
    data_type: String,
    is_nullable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    column_default: Option<String>,
}

#[derive(Serialize)]
struct ErrorPayload {
    message: String,
}

// IPC loop
#[tokio::main]
async fn main() {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = stdin.lock();
    let mut writer = io::BufWriter::new(stdout.lock());
    let mut client: Option<PgClient> = None;
    let mut line = String::new();

    loop {
        line.clear();

        // read one line from stdin
        match reader.read_line(&mut line) {
            Ok(0) => break, // EOF — parent process closed stdin
            Ok(_) => {}
            Err(e) => {
                eprintln!("stdin read error: {}", e);
                break;
            }
        }

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // parse JSON into Request, or return error
        let response = match serde_json::from_str::<Request>(trimmed) {
            Ok(request) => handle_request(request, &mut client).await,
            Err(e) => Response::Error {
                payload: ErrorPayload {
                    message: format!("Invalid request: {}", e),
                },
            },
        };

        // serialize Response to JSON and write to stdout
        if let Ok(json) = serde_json::to_string(&response) {
            let _ = writeln!(writer, "{}", json);
            let _ = writer.flush();
        }
    }
}

async fn handle_request(request: Request, client: &mut Option<PgClient>) -> Response {
    match request {
        Request::Ping => Response::Pong,

        Request::Connect { payload } => {
            match PgClient::connect(
                &payload.host,
                payload.port,
                &payload.database,
                &payload.user,
                &payload.password,
            )
            .await
            {
                Ok(c) => {
                    *client = Some(c);
                    Response::Connected
                }
                Err(e) => Response::Error {
                    payload: ErrorPayload {
                        message: format!("Connection failed: {}", e),
                    },
                },
            }
        }

        Request::Disconnect => {
            if let Some(c) = client.as_mut() {
                c.disconnect();
            }
            *client = None;
            Response::Disconnected
        }

        Request::Execute { payload } => match client {
            Some(c) => match c.execute(&payload.query).await {
                Ok(result) => Response::QueryResult {
                    payload: Some(QueryResultPayload {
                        columns: result
                            .columns
                            .into_iter()
                            .map(|col| ColumnInfoPayload {
                                name: col.name,
                                data_type: col.data_type,
                            })
                            .collect(),
                        rows: result.rows,
                        row_count: result.row_count,
                    }),
                },
                Err(e) => Response::Error {
                    payload: ErrorPayload {
                        message: format!("Query failed: {}", e),
                    },
                },
            },
            None => Response::Error {
                payload: ErrorPayload {
                    message: "Not connected".to_string(),
                },
            },
        },

        Request::GetTables => match client {
            Some(c) => match c.get_tables().await {
                Ok(tables) => Response::Tables {
                    payload: Some(
                        tables
                            .into_iter()
                            .map(|t| TableInfoPayload {
                                name: t.name,
                                schema: t.schema,
                                row_count: t.row_count,
                            })
                            .collect(),
                    ),
                },
                Err(e) => Response::Error {
                    payload: ErrorPayload {
                        message: format!("Failed to get tables: {}", e),
                    },
                },
            },
            None => Response::Error {
                payload: ErrorPayload {
                    message: "Not connected".to_string(),
                },
            },
        },

        Request::GetTableSchema {
            payload: table_name,
        } => match client {
            Some(c) => match c.get_table_schema(&table_name).await {
                Ok(schema) => Response::TableSchema {
                    payload: Some(TableSchemaPayload {
                        name: schema.name,
                        schema: schema.schema,
                        columns: schema
                            .columns
                            .into_iter()
                            .map(|col| ColumnDetailPayload {
                                name: col.name,
                                data_type: col.data_type,
                                is_nullable: col.is_nullable,
                                column_default: col.column_default,
                            })
                            .collect(),
                    }),
                },
                Err(e) => Response::Error {
                    payload: ErrorPayload {
                        message: format!("Failed to get table schema: {}", e),
                    },
                },
            },
            None => Response::Error {
                payload: ErrorPayload {
                    message: "Not connected".to_string(),
                },
            },
        },
    }
}
