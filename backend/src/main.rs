mod pg;

use pg::PgClient;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    let client = PgClient::connect("host=localhost user=agasta dbname=nominatim").await?;

    let tables = client.show_tables().await?;

    for table in tables {
        println!("{}", table);
    }

    Ok(())
}
