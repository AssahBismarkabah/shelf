use actix_web::{dev::Payload, error::ErrorUnauthorized, Error, FromRequest, HttpMessage, HttpRequest};

use futures::future::{ready, Ready};

#[derive(Debug)]
pub struct UserId(pub i32);

impl actix_web::FromRequest for UserId {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        match req.extensions().get::<i32>() {
            Some(user_id) => ready(Ok(UserId(*user_id))),
            None => ready(Err(ErrorUnauthorized("Unauthorized: Missing user ID"))),
        }
    }
}
