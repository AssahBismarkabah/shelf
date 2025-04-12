use actix_web::{error::Error as ActixError, web, HttpResponse};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

use crate::models::user::{self, Entity as User};

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

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}

pub async fn login(
    db: web::Data<DatabaseConnection>,
    credentials: web::Json<LoginRequest>,
) -> Result<HttpResponse, ActixError> {
    // Find user by email
    let user = User::find()
        .filter(user::Column::Email.eq(&credentials.email))
        .one(db.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    if let Some(user) = user {
        // Verify password
        if verify(&credentials.password, &user.password_hash).map_err(|_| {
            actix_web::error::ErrorInternalServerError("Password verification failed")
        })? {
            // Generate JWT token
            let claims = Claims {
                sub: user.id.to_string(),
                email: user.email.clone(),
                exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
            )
            .map_err(|_| actix_web::error::ErrorInternalServerError("Token generation failed"))?;

            Ok(HttpResponse::Ok().json(LoginResponse { token }))
        } else {
            Err(actix_web::error::ErrorUnauthorized("Invalid credentials"))
        }
    } else {
        Err(actix_web::error::ErrorUnauthorized("Invalid credentials"))
    }
}

pub async fn register(
    db: web::Data<DatabaseConnection>,
    user_data: web::Json<RegisterRequest>,
) -> Result<HttpResponse, ActixError> {
    // Hash password
    let password_hash = hash(user_data.password.as_bytes(), DEFAULT_COST)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Password hashing failed"))?;

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
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create user"))?;

    Ok(HttpResponse::Created().finish())
}
