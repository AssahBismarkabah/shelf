use actix_web::{
    dev::{Payload, ServiceRequest},
    error::ErrorUnauthorized,
    Error, FromRequest, HttpMessage, HttpRequest,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use futures_util::future::{ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthenticatedUser {
    pub id: i32,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,   // User ID as a string in the JWT
    email: String, // Add email to the claims
    exp: usize,
}

pub async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let token = credentials.token();
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => return Err((ErrorUnauthorized("Invalid token"), req)),
    };

    let id = match token_data.claims.sub.parse::<i32>() {
        Ok(id) => id,
        Err(_) => return Err((ErrorUnauthorized("Invalid user ID in token"), req)),
    };

    let user = AuthenticatedUser {
        id,
        email: token_data.claims.email.clone(),
    };
    req.extensions_mut().insert(user);
    Ok(req)
}

// Implement FromRequest for AuthenticatedUser
impl FromRequest for AuthenticatedUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        if let Some(user) = req.extensions().get::<AuthenticatedUser>() {
            ready(Ok(user.clone()))
        } else {
            ready(Err(ErrorUnauthorized("User not authenticated")))
        }
    }
}
