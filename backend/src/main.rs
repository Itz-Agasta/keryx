mod pg;

use pg::PgClient;

#[tokio::main]
async fn main() -> Result<(), tokio_postgres::Error> {
    let client = PgClient::connect("host=localhost user=agasta dbname=cli_test").await?;

    // Testing
    let _dbs = client.show_databases().await?;
    let _tables = client.show_tables().await?;
    let _schemas = client.show_schemas().await?;
    let _views = client.show_views().await?;
    let _functions = client.show_functions().await?;

    for db in _dbs {
        println!("{}", db);
    }
    print!("\n");
    for table in _tables {
        println!("{}", table);
    }

    // TODO: perform v1 test .. i have to plan how can i send this data
    // to the cli in an optimzie manner.

    Ok(())
}
