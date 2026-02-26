use tokio_postgres::{Client, Error, NoTls};

// I will add more later. I may need derive later
pub struct PgClient {
    client: Client,
}

impl PgClient {
    pub async fn connect(connection_string: &str) -> Result<Self, Error> {
        let (client, connection) = tokio_postgres::connect(connection_string, NoTls).await?;

        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });

        Ok(PgClient { client })
    }

    /// Returns ALL dbs in the PostgreSQL server
    pub async fn show_databases(&self) -> Result<Vec<String>, Error> {
        let rows = self
            .client
            .query(
                "SELECT datname, pg_size_pretty(pg_database_size(datname)) 
        FROM pg_database 
        WHERE datistemplate = false;",
                &[],
            )
            .await?;

        let mut dbs = Vec::new();
        for row in rows {
            let dbname: &str = row.get(0);
            dbs.push(dbname.to_string());
        }

        Ok(dbs)
    }

    /// Returns all schemas in the current database.
    pub async fn show_schemas(&self) -> Result<Vec<String>, Error> {
        let rows = self
            .client
            .query(
                "SELECT schema_name
                 FROM information_schema.schemata;",
                &[],
            )
            .await?;

        let schemas = rows
            .iter()
            .map(|row| row.get::<_, &str>(0).to_string())
            .collect();

        Ok(schemas)
    }

    // Returns all tables in the current database.
    pub async fn show_tables(&self) -> Result<Vec<String>, Error> {
        let rows = self
            .client
            .query(
                "SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public';",
                &[],
            )
            .await?;

        let mut tables = Vec::new();
        for row in rows {
            let tablename: &str = row.get(0);
            tables.push(tablename.to_string());
        }

        Ok(tables)
    }

    /// Returns all views in the `public` schema.
    pub async fn show_views(&self) -> Result<Vec<String>, Error> {
        let rows = self
            .client
            .query(
                "SELECT viewname
                 FROM pg_views
                 WHERE schemaname = 'public';",
                &[],
            )
            .await?;

        let mut views = Vec::new();
        for row in rows {
            let viewname: &str = row.get(0);
            views.push(viewname.to_string());
        }

        Ok(views)
    }

    /// Returns all functions in the current database.
    pub async fn show_functions(&self) -> Result<Vec<String>, Error> {
        let rows = self
            .client
            .query(
                "SELECT routine_name
                 FROM information_schema.routines
                 WHERE routine_type = 'FUNCTION';",
                &[],
            )
            .await?;

        let functions = rows
            .iter()
            .map(|row| row.get::<_, &str>(0).to_string())
            .collect();

        Ok(functions)
    }
}
