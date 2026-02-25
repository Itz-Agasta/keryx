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
    
    pub async fn show_databases(&self) -> Result<Vec<String>, Error> {
        let rows = self.client.query("SELECT datname, pg_size_pretty(pg_database_size(datname)) 
        FROM pg_database 
        WHERE datistemplate = false;", &[])
        .await?;
        
        let mut dbs = Vec::new();
        for row in rows {
            let dbname : &str = row.get(0);
            dbs.push(dbname.to_string());
        }
        
        Ok(dbs)
    }
    
    // What schemas in current DB?

    // what tables in the current Db
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
    
    // Show Viwes
    // show functions
}
