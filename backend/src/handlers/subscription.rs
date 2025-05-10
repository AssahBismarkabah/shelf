use crate::models::subscription::{self, Entity as Subscription};
use crate::models::user::Entity as User;
use actix_web::{web, HttpResponse, Responder};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use serde_json;

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct SubscriptionUpdate {
    pub user_id: i32,
    pub plan: String,
}

pub async fn update_subscription(
    data: web::Json<SubscriptionUpdate>,
    db: web::Data<DatabaseConnection>,
) -> impl Responder {
    let user_id = data.user_id;
    let plan = &data.plan;

    // Define storage limits based on plan
    let storage_limit_bytes: i64 = match plan.as_str() {
        "none" => 104_857_600,          // 100 MB for free plan
        "basic" => 1_073_741_824,       // 1 GB
        "premium" => 5_368_709_120,     // 5 GB
        "enterprise" => 10_737_418_240, // 10 GB
        _ => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid plan"
            }))
        }
    };

    // First check if subscription exists
    match Subscription::find()
        .filter(subscription::Column::UserId.eq(user_id))
        .one(db.get_ref())
        .await
    {
        Ok(Some(_)) => {
            // Update existing subscription
            match Subscription::update_many()
                .col_expr(subscription::Column::Plan, plan.into())
                .col_expr(
                    subscription::Column::StorageLimitBytes,
                    storage_limit_bytes.into(),
                )
                .col_expr(
                    subscription::Column::Status,
                    "active".into(),
                )
                .filter(subscription::Column::UserId.eq(user_id))
                .exec(db.get_ref())
                .await
            {
                Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                    "message": format!("Subscription updated to {} with storage limit {} bytes", plan, storage_limit_bytes),
                    "plan": plan,
                    "storage_limit_bytes": storage_limit_bytes,
                    "status": "active"
                })),
                Err(e) => {
                    HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error updating subscription: {}", e)
                    }))
                }
            }
        }
        Ok(None) => {
            // Create new subscription
            let new_subscription = subscription::ActiveModel {
                user_id: Set(user_id),
                stripe_customer_id: Set("none".to_string()),
                stripe_subscription_id: Set("none".to_string()),
                status: Set("active".to_string()),
                plan: Set(plan.clone()),
                storage_limit_bytes: Set(storage_limit_bytes),
                current_period_end: Set(Utc::now().into()),
                ..Default::default()
            };

            match new_subscription.insert(db.get_ref()).await {
                Ok(subscription) => HttpResponse::Ok().json(serde_json::json!({
                    "message": "Subscription created successfully",
                    "plan": subscription.plan,
                    "storage_limit_bytes": subscription.storage_limit_bytes,
                    "status": subscription.status
                })),
                Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Error creating subscription: {}", e)
                })),
            }
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Error checking subscription: {}", e)
        })),
    }
}

pub async fn get_subscription(
    user: crate::middleware::auth::AuthenticatedUser,
    db: web::Data<DatabaseConnection>,
) -> impl Responder {
    let user_id = user.id;

    // First check if user exists
    match User::find_by_id(user_id).one(db.get_ref()).await {
        Ok(Some(_)) => {
            // User exists, proceed with subscription check
            match Subscription::find()
                .filter(subscription::Column::UserId.eq(user_id))
                .one(db.get_ref())
                .await
            {
                Ok(Some(subscription)) => HttpResponse::Ok().json(serde_json::json!({
                    "plan": subscription.plan,
                    "storage_limit_bytes": subscription.storage_limit_bytes,
                    "status": subscription.status,
                    "current_period_end": subscription.current_period_end
                })),
                Ok(None) => {
                    // Create a new subscription with no storage if none exists
                    let new_subscription = subscription::ActiveModel {
                        user_id: Set(user_id),
                        stripe_customer_id: Set("none".to_string()),
                        stripe_subscription_id: Set("none".to_string()),
                        status: Set("inactive".to_string()),
                        plan: Set("none".to_string()),
                        storage_limit_bytes: Set(104_857_600), // 100 MB for free plan
                        current_period_end: Set(Utc::now().into()),
                        ..Default::default()
                    };

                    match new_subscription.insert(db.get_ref()).await {
                        Ok(subscription) => HttpResponse::Ok().json(serde_json::json!({
                            "plan": subscription.plan,
                            "storage_limit_bytes": subscription.storage_limit_bytes,
                            "status": subscription.status,
                            "current_period_end": subscription.current_period_end
                        })),
                        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": format!("Error creating subscription: {}", e)
                        })),
                    }
                }
                Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Error fetching subscription: {}", e)
                })),
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "User not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Error checking user: {}", e)
        })),
    }
}
