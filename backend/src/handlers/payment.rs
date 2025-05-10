use crate::{
    error::AppError,
    middleware::auth::AuthenticatedUser,
    models::subscription::{self, Entity as Subscription},
    services::payment::PaymentService,
};
use actix_web::{web, HttpResponse};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
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
    user: AuthenticatedUser,
    path: web::Path<String>,
    db: web::Data<DatabaseConnection>,
) -> Result<HttpResponse, AppError> {
    let reference_id = path.into_inner();
    let payment = payment_service
        .check_payment_status(reference_id.clone())
        .await?;

    println!("Payment status: {:?}", payment.status);
    println!("Payment amount: {}", payment.amount);

    // If payment is successful, update subscription
    if format!("{:?}", payment.status) == "Successful" {
        println!("Payment successful, updating subscription");
        // Determine plan based on payment amount
        let amount: i64 = payment.amount.to_string().parse().unwrap_or(0);
        let plan = if amount >= 10000 {
            "enterprise"
        } else if amount >= 5000 {
            "premium"
        } else {
            "basic"
        };
        println!("Updating to plan: {}", plan);
        let update_result = Subscription::update_many()
            .col_expr(subscription::Column::Plan, plan.into())
            .col_expr(
                subscription::Column::StorageLimitBytes,
                get_storage_limit_for_plan(plan).into(),
            )
            .col_expr(subscription::Column::Status, "active".into())
            .filter(subscription::Column::UserId.eq(user.id))
            .exec(db.get_ref())
            .await;

        match update_result {
            Ok(_) => println!("Subscription updated successfully"),
            Err(e) => {
                println!("Failed to update subscription: {}", e);
                return Err(AppError::InternalServerError(format!(
                    "Failed to update subscription: {}",
                    e
                )));
            }
        }
    } else {
        println!("Payment not successful, status: {:?}", payment.status);
    }

    Ok(HttpResponse::Ok().json(PaymentResponse {
        reference_id: payment.reference_id,
        status: format!("{:?}", payment.status),
    }))
}

fn get_storage_limit_for_plan(plan: &str) -> i64 {
    match plan {
        "basic" => 1_073_741_824,       // 1 GB
        "premium" => 5_368_709_120,     // 5 GB
        "enterprise" => 10_737_418_240, // 10 GB
        _ => 0,                         // Default to 0 if plan is invalid
    }
}
