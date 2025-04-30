use crate::models::subscription::{self, Entity as Subscription};
use actix_web::{web, HttpResponse, Responder};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct SubscriptionUpdate {
    pub user_id: i32,
    pub plan: String,
}

#[allow(dead_code)]
pub async fn update_subscription(
    data: web::Json<SubscriptionUpdate>,
    db: web::Data<DatabaseConnection>,
) -> impl Responder {
    let user_id = data.user_id;
    let plan = &data.plan;

    // Define storage limits based on plan
    let storage_limit_bytes: i64 = match plan.as_str() {
        "basic" => 1_073_741_824,       // 1 GB
        "premium" => 5_368_709_120,     // 5 GB
        "enterprise" => 10_737_418_240, // 10 GB
        _ => return HttpResponse::BadRequest().body("Invalid plan"),
    };

    // Update subscription in database
    match Subscription::update_many()
        .col_expr(subscription::Column::Plan, plan.into())
        .col_expr(
            subscription::Column::StorageLimitBytes,
            storage_limit_bytes.into(),
        )
        .filter(subscription::Column::UserId.eq(user_id))
        .exec(db.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().body(format!(
            "Subscription updated to {} with storage limit {} bytes",
            plan, storage_limit_bytes
        )),
        Err(e) => {
            HttpResponse::InternalServerError().body(format!("Error updating subscription: {}", e))
        }
    }
}
