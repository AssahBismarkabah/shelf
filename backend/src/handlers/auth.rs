use actix_web::{error::ResponseError, http::StatusCode, web, HttpResponse};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use derive_more::{Display, Error};
use jsonwebtoken::{encode, EncodingKey, Header};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

use crate::models::user::{self, Entity as User};

#[derive(Debug, Display, Error)]
pub enum AppError {
    #[display(fmt = "Internal Server Error")]
    InternalServerError,
    #[display(fmt = "Unauthorized")]
    Unauthorized,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match *self {
            AppError::InternalServerError => HttpResponse::InternalServerError().finish(),
            AppError::Unauthorized => HttpResponse::Unauthorized().finish(),
        }
    }

    fn status_code(&self) -> StatusCode {
        match *self {
            AppError::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
        }
    }
}

#[derive(Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    token: String,
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    email: String,
    password: String,
    full_name: String,
}

pub async fn login(
    db: web::Data<DatabaseConnection>,
    credentials: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    // Find user by email
    let user = User::find()
        .filter(user::Column::Email.eq(&credentials.email))
        .one(db.get_ref())
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if let Some(user) = user {
        // Verify password
        if verify(&credentials.password, &user.password_hash)
            .map_err(|_| AppError::InternalServerError)?
        {
            // Generate JWT token
            let claims = Claims {
                sub: user.id.to_string(),
                exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
            )
            .map_err(|_| AppError::InternalServerError)?;

            Ok(HttpResponse::Ok().json(LoginResponse { token }))
        } else {
            Err(AppError::Unauthorized)
        }
    } else {
        Err(AppError::Unauthorized)
    }
}

pub async fn register(
    db: web::Data<DatabaseConnection>,
    user_data: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    // Hash password
    let password_hash = hash(user_data.password.as_bytes(), DEFAULT_COST)
        .map_err(|_| AppError::InternalServerError)?;

    // Create new user
    let new_user = user::ActiveModel {
        email: Set(user_data.email.clone()),
        password_hash: Set(password_hash),
        full_name: Set(user_data.full_name.clone()),
        is_admin: Set(false),
        is_active: Set(true),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    // Insert user into database
    User::insert(new_user)
        .exec(db.get_ref())
        .await
        .map_err(|_| AppError::InternalServerError)?;

    Ok(HttpResponse::Created().finish())
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}
