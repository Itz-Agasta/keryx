mod db;
use db::PgClient;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    let client = PgClient::connect("localhost", 5432, "cli_test", "agasta", "some-pass").await?;

    // testing
    let tables = client.get_tables().await?;

    for table in &tables {
        println!("{}", table.name);
    }
    
    // TODO: Add sarde + IPC loop

    Ok(())
}
