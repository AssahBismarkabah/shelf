use crate::services::storage::StorageService;
use actix_web::{web, App, HttpResponse, HttpServer};
use actix_web_httpauth::middleware::HttpAuthentication;
use sea_orm::Database;
use std::env;
use std::sync::Arc;

mod config;
mod handlers;
mod middleware;
mod models;
mod services;

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Initialize database connection
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Initialize storage service
    let minio_endpoint = env::var("MINIO_ENDPOINT").expect("MINIO_ENDPOINT must be set");
    let minio_bucket = env::var("MINIO_BUCKET").expect("MINIO_BUCKET must be set");
    let storage_service = StorageService::new(minio_endpoint, minio_bucket)
        .await
        .expect("Failed to initialize storage service");

    // Initialize document service
    let document_service = Arc::new(services::document::DocumentService::new(
        db.clone(),
        storage_service,
    ));

    // Initialize subscription service
    let stripe_secret_key = env::var("STRIPE_SECRET_KEY").expect("STRIPE_SECRET_KEY must be set");
    let subscription_service = Arc::new(services::subscription::SubscriptionService::new(
        db.clone(),
        stripe_secret_key,
    ));

    println!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(move || {
        let auth = HttpAuthentication::bearer(middleware::auth::validator);

        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::from(document_service.clone()))
            .app_data(web::Data::from(subscription_service.clone()))
            .route("/health", web::get().to(health_check))
            .service(
                web::scope("/api")
                    .service(
                        web::scope("/auth")
                            .route("/login", web::post().to(handlers::auth::login))
                            .route("/register", web::post().to(handlers::auth::register)),
                    )
                    .service(
                        web::scope("")
                            .wrap(auth)
                            .service(
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
                            )
                            .service(
                                web::scope("/subscription")
                                    .service(handlers::subscription::get_subscription)
                                    .service(handlers::subscription::create_subscription)
                                    .service(handlers::subscription::cancel_subscription),
                            ),
                    )
                    .service(handlers::subscription::stripe_webhook),
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
