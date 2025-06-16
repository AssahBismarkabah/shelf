use crate::services::storage::StorageService;
use actix_cors::Cors;
use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use actix_web_httpauth::middleware::HttpAuthentication;
use handlers::payment::{check_payment_status, request_payment};
use handlers::subscription::{update_subscription, get_subscription};
use services::payment::PaymentService;
use std::env;

mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Database connection and initialization
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = config::database::initialize_database(&database_url)
        .await
        .expect("Failed to initialize database");

    // Initialize storage service
    let storage = StorageService::new(
        env::var("MINIO_ENDPOINT").expect("MINIO_ENDPOINT must be set"),
        env::var("MINIO_BUCKET").expect("MINIO_BUCKET must be set"),
        env::var("AWS_REGION").expect("AWS_REGION must be set"),
    )
    .await
    .expect("Failed to initialize storage service");

    // Initialize payment service
    let payment_service = PaymentService::new(pool.clone())
        .await
        .expect("Failed to initialize payment service");

    println!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(move || {
        let auth = HttpAuthentication::bearer(middleware::auth::validator);

        // Configure CORS
        let cors = Cors::permissive()
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec!["Authorization", "Content-Type"])
            .supports_credentials();

        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(storage.clone()))
            .app_data(web::Data::new(payment_service.clone()))
            .route("/health", web::get().to(health_check)) //  health check route for render serivce
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
                                web::scope("/payments")
                                    .service(
                                        web::resource("/request")
                                            .route(web::post().to(request_payment)),
                                    )
                                    .service(
                                        web::resource("/status/{reference_id}")
                                            .route(web::get().to(check_payment_status)),
                                    ),
                            )
                            .service(
                                web::resource("/subscription/update")
                                    .route(web::post().to(update_subscription)),
                            )
                            .service(
                                web::resource("/subscription")
                                    .route(web::get().to(get_subscription)),
                            ),
                    ),
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

// Health check handler
async fn health_check() -> impl Responder {
    HttpResponse::Ok().finish()
}
