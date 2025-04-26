use crate::{
    error::AppError, middleware::auth::AuthenticatedUser, services::payment::PaymentService,
};
use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PaymentRequest {
    pub amount: String,
    pub phone_number: String,
    pub payer_message: String,
    pub payee_note: String,
}

#[derive(Debug, Serialize)]
pub struct PaymentResponse {
    pub reference_id: String,
    pub status: String,
}

pub async fn request_payment(
    payment_service: web::Data<PaymentService>,
    user: AuthenticatedUser,
    payment_data: web::Json<PaymentRequest>,
) -> Result<HttpResponse, AppError> {
    let payment = payment_service
        .request_payment(
            user.id,
            payment_data.amount.clone(),
            payment_data.phone_number.clone(),
            payment_data.payer_message.clone(),
            payment_data.payee_note.clone(),
        )
        .await?;

    Ok(HttpResponse::Ok().json(PaymentResponse {
        reference_id: payment.reference_id,
        status: format!("{:?}", payment.status),
    }))
}

pub async fn check_payment_status(
    payment_service: web::Data<PaymentService>,
    _user: AuthenticatedUser,
    reference_id: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let payment = payment_service
        .check_payment_status(reference_id.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(PaymentResponse {
        reference_id: payment.reference_id,
        status: format!("{:?}", payment.status),
    }))
}
