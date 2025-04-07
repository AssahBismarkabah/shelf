use actix_web::{web, App, HttpServer};
use sea_orm::{Database, DatabaseConnection};
use std::sync::Arc;
use actix_web_httpauth::middleware::HttpAuthentication;

mod config;
mod handlers;
mod middleware;
mod models;
mod services;

use handlers::auth::{login, register};
use handlers::pdf::{upload_pdf, download_pdf};
use middleware::auth::validator;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    //Get SeaORM database connection
    let pool: DatabaseConnection = Database::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Wrap in Actix's `web::Data` to share across workers
    let pool_data = web::Data::new(pool);

    HttpServer::new(move || {
        let auth = HttpAuthentication::bearer(validator);

        App::new()
            .app_data(pool_data.clone()) //  Correct usage
            .service(
                web::scope("/api")
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to(login))
                            .route("/register", web::post().to(register)),
                    )
                    .service(
                        web::scope("")
                            .wrap(auth)
                            .route("/upload", web::post().to(upload_pdf))
                            .route("/download/{filename}", web::get().to(download_pdf)),
                    ),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
