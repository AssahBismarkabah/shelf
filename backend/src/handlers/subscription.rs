use crate::error::AppError;
use crate::services::subscription::{CreateSubscriptionRequest, SubscriptionService};
use actix_web::{error::ResponseError, get, post, web, HttpResponse, Responder};

#[get("/subscription")]
pub async fn get_subscription(
    user_id: web::ReqData<i32>,
    subscription_service: web::Data<SubscriptionService>,
) -> impl Responder {
    match subscription_service.get_user_subscription(*user_id).await {
        Ok(subscription) => HttpResponse::Ok().json(subscription),
        Err(e) => e.error_response(),
    }
}

#[post("/subscription")]
pub async fn create_subscription(
    user_id: web::ReqData<i32>,
    subscription_service: web::Data<SubscriptionService>,
    req: web::Json<CreateSubscriptionRequest>,
) -> impl Responder {
    match subscription_service
        .create_subscription(*user_id, req.0)
        .await
    {
        Ok(subscription) => HttpResponse::Created().json(subscription),
        Err(e) => e.error_response(),
    }
}

#[post("/subscription/cancel")]
pub async fn cancel_subscription(
    user_id: web::ReqData<i32>,
    subscription_service: web::Data<SubscriptionService>,
) -> impl Responder {
    match subscription_service.cancel_subscription(*user_id).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => e.error_response(),
    }
}

#[post("/webhook/stripe")]
pub async fn stripe_webhook(
    subscription_service: web::Data<SubscriptionService>,
    payload: web::Bytes,
    req: actix_web::HttpRequest,
) -> Result<HttpResponse, AppError> {
    let signature = req
        .headers()
        .get("Stripe-Signature")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::BadRequest("Missing Stripe signature".into()))?;

    let webhook_secret = std::env::var("STRIPE_WEBHOOK_SECRET")
        .map_err(|_| AppError::Internal("Missing webhook secret".into()))?;

    match subscription_service
        .handle_webhook(&payload, signature, &webhook_secret)
        .await
    {
        Ok(_) => Ok(HttpResponse::Ok().finish()),
        Err(e) => Ok(e.error_response()),
    }
}
