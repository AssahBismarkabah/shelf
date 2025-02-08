use actix_web::{web, App, HttpServer};
use sea_orm::Database;
use std::env;

mod config;
mod handlers;
mod models;
mod services;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Database connection
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = Database::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(
                web::scope("/api")
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to(handlers::auth::login))
                            .route("/register", web::post().to(handlers::auth::register))
                    )
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}