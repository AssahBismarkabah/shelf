use crate::models::subscription::SubscriptionPlan;
use crate::services::subscription::{CreateSubscriptionRequest, SubscriptionService};
use crate::AppError;
use actix_web::{get, post, web, HttpResponse, Responder};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct WebhookRequest {
    #[serde(rename = "type")]
    event_type: String,
    data: serde_json::Value,
}

#[get("/subscription")]
pub async fn get_subscription(
    user_id: web::ReqData<i32>,
    subscription_service: web::Data<SubscriptionService>,
) -> impl Responder {
    match subscription_service.get_user_subscription(*user_id).await {
        Ok(subscription) => HttpResponse::Ok().json(subscription),
        Err(e) => e.into(),
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
        Err(e) => e.into(),
    }
}

#[post("/subscription/cancel")]
pub async fn cancel_subscription(
    user_id: web::ReqData<i32>,
    subscription_service: web::Data<SubscriptionService>,
) -> impl Responder {
    match subscription_service.cancel_subscription(*user_id).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => e.into(),
    }
}

#[post("/webhook/stripe")]
pub async fn stripe_webhook(
    subscription_service: web::Data<SubscriptionService>,
    payload: web::Bytes,
    req: actix_web::HttpRequest,
) -> impl Responder {
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
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => e.into(),
    }
}
