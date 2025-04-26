use actix_web::{error::ResponseError, HttpResponse};
use derive_more::Display;
use sea_orm::DbErr;
use serde_json::json;

#[derive(Debug, Display)]
pub enum AppError {
    #[display(fmt = "Internal Server Error: {}", _0)]
    InternalServerError(String),

    #[display(fmt = "Bad Request: {}", _0)]
    BadRequest(String),

    #[display(fmt = "Not Found: {}", _0)]
    NotFound(String),
}

impl From<DbErr> for AppError {
    fn from(err: DbErr) -> Self {
        AppError::InternalServerError(format!("Database error: {}", err))
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::InternalServerError(ref message) => {
                HttpResponse::InternalServerError().json(json!({ "error": message }))
            }
            AppError::BadRequest(ref message) => {
                HttpResponse::BadRequest().json(json!({ "error": message }))
            }
            AppError::NotFound(ref message) => {
                HttpResponse::NotFound().json(json!({ "error": message }))
            }
        }
    }
}
