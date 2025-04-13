use crate::models::subscription::{
    Entity as Subscription, Model as SubscriptionModel, SubscriptionPlan,
};
use crate::models::user::Entity as User;
use crate::AppError;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::{Deserialize, Serialize};
use stripe::{Client, Customer, Price, Subscription as StripeSubscription};
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSubscriptionRequest {
    pub plan: SubscriptionPlan,
}

pub struct SubscriptionService {
    db: DatabaseConnection,
    stripe: Client,
}

impl SubscriptionService {
    pub fn new(db: DatabaseConnection, stripe_secret_key: String) -> Self {
        let stripe = Client::new(stripe_secret_key);
        Self { db, stripe }
    }

    pub async fn get_user_subscription(&self, user_id: i32) -> Result<SubscriptionModel, AppError> {
        let subscription = Subscription::find()
            .filter(crate::models::subscription::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("Subscription not found".into()))?;

        Ok(subscription)
    }

    pub async fn create_subscription(
        &self,
        user_id: i32,
        req: CreateSubscriptionRequest,
    ) -> Result<SubscriptionModel, AppError> {
        // Get user
        let user = User::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("User not found".into()))?;

        // Create or get Stripe customer
        let customer = if let Some(existing_sub) = Subscription::find()
            .filter(crate::models::subscription::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?
        {
            if let Some(stripe_customer_id) = existing_sub.stripe_customer_id {
                Customer::retrieve(&stripe_customer_id, &self.stripe).await?
            } else {
                self.create_stripe_customer(&user.email).await?
            }
        } else {
            self.create_stripe_customer(&user.email).await?
        };

        // Create subscription based on plan
        let subscription = match req.plan {
            SubscriptionPlan::Free => {
                // For free plan, just create a local subscription record
                let subscription = crate::models::subscription::ActiveModel {
                    user_id: Set(user_id),
                    plan: Set(SubscriptionPlan::Free),
                    stripe_customer_id: Set(Some(customer.id)),
                    stripe_subscription_id: Set(None),
                    status: Set("active".to_string()),
                    current_period_start: Set(OffsetDateTime::now_utc()),
                    current_period_end: Set(
                        OffsetDateTime::now_utc() + time::Duration::days(365 * 10)
                    ), // 10 years
                    ..Default::default()
                };
                subscription.insert(&self.db).await?
            }
            _ => {
                // For paid plans, create Stripe subscription
                if let Some(price_id) = req.plan.price_id() {
                    let price = Price::retrieve(price_id, &self.stripe).await?;
                    let stripe_subscription = StripeSubscription::create(&self.stripe)
                        .customer(customer.id)
                        .items(&[stripe::CreateSubscriptionItems {
                            price: Some(price.id),
                            ..Default::default()
                        }])
                        .expand(&["latest_invoice.payment_intent"])
                        .await?;

                    let subscription = crate::models::subscription::ActiveModel {
                        user_id: Set(user_id),
                        plan: Set(req.plan),
                        stripe_customer_id: Set(Some(customer.id)),
                        stripe_subscription_id: Set(Some(stripe_subscription.id)),
                        status: Set(stripe_subscription.status.to_string()),
                        current_period_start: Set(OffsetDateTime::from_unix_timestamp(
                            stripe_subscription.current_period_start.unwrap_or(0) as i64,
                        )?),
                        current_period_end: Set(OffsetDateTime::from_unix_timestamp(
                            stripe_subscription.current_period_end.unwrap_or(0) as i64,
                        )?),
                        ..Default::default()
                    };
                    subscription.insert(&self.db).await?
                } else {
                    return Err(AppError::BadRequest("Invalid plan".into()));
                }
            }
        };

        Ok(subscription)
    }

    async fn create_stripe_customer(&self, email: &str) -> Result<Customer, AppError> {
        let customer = Customer::create(&self.stripe).email(email).await?;
        Ok(customer)
    }

    pub async fn cancel_subscription(&self, user_id: i32) -> Result<(), AppError> {
        let subscription = self.get_user_subscription(user_id).await?;

        if let Some(stripe_subscription_id) = subscription.stripe_subscription_id {
            // Cancel Stripe subscription
            StripeSubscription::cancel(&stripe_subscription_id, &self.stripe).await?;
        }

        // Update local subscription to free plan
        let mut subscription: crate::models::subscription::ActiveModel = subscription.into();
        subscription.plan = Set(SubscriptionPlan::Free);
        subscription.status = Set("canceled".to_string());
        subscription.update(&self.db).await?;

        Ok(())
    }

    pub async fn handle_webhook(
        &self,
        payload: &[u8],
        signature: &str,
        webhook_secret: &str,
    ) -> Result<(), AppError> {
        let event = stripe::Webhook::construct_event(payload, signature, webhook_secret)?;

        match event.type_.as_str() {
            "customer.subscription.updated" | "customer.subscription.deleted" => {
                if let Some(subscription) = event.data.object.as_object() {
                    let stripe_subscription_id = subscription["id"].as_str().unwrap_or_default();
                    let status = subscription["status"].as_str().unwrap_or_default();

                    // Update local subscription
                    if let Some(local_sub) = Subscription::find()
                        .filter(
                            crate::models::subscription::Column::StripeSubscriptionId
                                .eq(stripe_subscription_id),
                        )
                        .one(&self.db)
                        .await?
                    {
                        let mut subscription: crate::models::subscription::ActiveModel =
                            local_sub.into();
                        subscription.status = Set(status.to_string());
                        subscription.update(&self.db).await?;
                    }
                }
            }
            _ => {}
        }

        Ok(())
    }
}
