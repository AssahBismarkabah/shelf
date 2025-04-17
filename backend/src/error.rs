use actix_web::{error::ResponseError, HttpResponse};
use derive_more::Display;
use serde_json::json;
use std::error::Error;

#[derive(Debug, Display)]
pub enum AppError {
    #[display("Internal Server Error")]
    InternalServerError,

    #[display("Bad Request: {}", _0)]
    BadRequest(String),

    #[display("Unauthorized: {}", _0)]
    Unauthorized(String),

    #[display("Not Found: {}", _0)]
    NotFound(String),

    #[display("Forbidden: {}", _0)]
    Forbidden(String),

    #[display("Internal: {}", _0)]
    Internal(String),
}

impl Error for AppError {}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::InternalServerError => {
                HttpResponse::InternalServerError().json(json!({"error": "Internal Server Error"}))
            }
            AppError::BadRequest(message) => {
                HttpResponse::BadRequest().json(json!({"error": message}))
            }
            AppError::Unauthorized(message) => {
                HttpResponse::Unauthorized().json(json!({"error": message}))
            }
            AppError::NotFound(message) => HttpResponse::NotFound().json(json!({"error": message})),
            AppError::Forbidden(message) => {
                HttpResponse::Forbidden().json(json!({"error": message}))
            }
            AppError::Internal(message) => {
                HttpResponse::InternalServerError().json(json!({"error": message}))
            }
        }
    }

    fn status_code(&self) -> actix_web::http::StatusCode {
        match self {
            AppError::InternalServerError => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequest(_) => actix_web::http::StatusCode::BAD_REQUEST,
            AppError::Unauthorized(_) => actix_web::http::StatusCode::UNAUTHORIZED,
            AppError::NotFound(_) => actix_web::http::StatusCode::NOT_FOUND,
            AppError::Forbidden(_) => actix_web::http::StatusCode::FORBIDDEN,
            AppError::Internal(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl From<sea_orm::DbErr> for AppError {
    fn from(_err: sea_orm::DbErr) -> Self {
        AppError::InternalServerError
    }
}

impl From<Box<dyn std::error::Error>> for AppError {
    fn from(err: Box<dyn std::error::Error>) -> Self {
        AppError::Internal(err.to_string())
    }
}

impl From<stripe::StripeError> for AppError {
    fn from(err: stripe::StripeError) -> Self {
        AppError::Internal(err.to_string())
    }
}
