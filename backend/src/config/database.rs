use sea_orm::DatabaseConnection;
use std::error::Error;

pub async fn initialize_database(database_url: &str) -> Result<DatabaseConnection, Box<dyn Error>> {
    // Connect to the database
    println!("Connecting to database...");
    let db = sea_orm::Database::connect(database_url).await?;

    // The init.sql file is already executed by the Postgres container
    // We just need to verify the connection
    println!("Database connection established successfully");

    Ok(db)
}
