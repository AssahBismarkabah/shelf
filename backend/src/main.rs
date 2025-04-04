use crate::services::storage::StorageService;
use actix_web::{web, App, HttpServer};
use actix_web_httpauth::middleware::HttpAuthentication;
use sea_orm::Database;
use std::env;

mod config;
mod handlers;
mod middleware;
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

    // Initialize storage service
    let storage = StorageService::new(
        env::var("MINIO_ENDPOINT").expect("MINIO_ENDPOINT must be set"),
        env::var("MINIO_BUCKET").expect("MINIO_BUCKET must be set"),
    )
    .await
    .expect("Failed to initialize storage service");

    HttpServer::new(move || {
        let auth = HttpAuthentication::bearer(middleware::auth::validator);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(storage.clone()))
            .service(
                web::scope("/api")
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to(handlers::auth::login))
                            .route("/register", web::post().to(handlers::auth::register)),
                    )
                    .service(
                        web::scope("").wrap(auth).service(
                            web::scope("/documents")
                                .route("", web::post().to(handlers::document::upload_document))
                                .route("", web::get().to(handlers::document::list_documents))
                                .route(
                                    "/{id}",
                                    web::get().to(handlers::document::download_document),
                                )
                                .route(
                                    "/{id}",
                                    web::delete().to(handlers::document::delete_document),
                                ),
                        ),
                    ),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
