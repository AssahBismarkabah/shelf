use crate::error::AppError;
use crate::models::subscription::{
    Entity as Subscription, Model as SubscriptionModel, SubscriptionPlan,
};
use crate::models::user::Entity as User;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use stripe::{
    Client, CreateCustomer, CreateSubscription, Customer, CustomerId, Price, PriceId,
    Subscription as StripeSubscription, SubscriptionId,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSubscriptionRequest {
    pub plan: SubscriptionPlan,
}

pub struct SubscriptionService {
    pub db: DatabaseConnection,
    pub stripe: Client,
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
                Customer::retrieve(
                    &self.stripe,
                    &CustomerId::from_str(&stripe_customer_id)
                        .map_err(|_| AppError::InternalServerError)?,
                    &[],
                )
                .await?
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
                    stripe_customer_id: Set(Some(customer.id.to_string())),
                    stripe_subscription_id: Set(None),
                    status: Set("active".to_string()),
                    current_period_start: Set(chrono::Utc::now().into()),
                    current_period_end: Set((chrono::Utc::now()
                        + chrono::Duration::days(365 * 10))
                    .into()),
                    ..Default::default()
                };
                subscription.insert(&self.db).await?
            }
            _ => {
                // For paid plans, create Stripe subscription
                if let Some(price_id) = req.plan.price_id() {
                    let price = Price::retrieve(
                        &self.stripe,
                        &PriceId::from_str(&price_id).map_err(|_| AppError::InternalServerError)?,
                        &[],
                    )
                    .await?;
                    // Store customer ID as string to avoid moving customer.id
                    let customer_id_str = customer.id.to_string();
                    let subscription_params = CreateSubscription {
                        customer: customer.id,
                        items: Some(vec![stripe::CreateSubscriptionItems {
                            price: Some(price.id.to_string()),
                            quantity: Some(1),
                            ..Default::default()
                        }]),
                        expand: &["latest_invoice.payment_intent"],
                        add_invoice_items: None,
                        application_fee_percent: None,
                        automatic_tax: None,
                        backdate_start_date: None,
                        billing_cycle_anchor: None,
                        billing_cycle_anchor_config: None,
                        billing_thresholds: None,
                        cancel_at: None,
                        cancel_at_period_end: None,
                        collection_method: None,
                        coupon: None,
                        currency: None,
                        days_until_due: None,
                        default_payment_method: None,
                        default_source: None,
                        default_tax_rates: None,
                        description: None,
                        invoice_settings: None,
                        metadata: None,
                        off_session: None,
                        on_behalf_of: None,
                        payment_behavior: None,
                        payment_settings: None,
                        pending_invoice_item_interval: None,
                        promotion_code: None,
                        proration_behavior: None,
                        transfer_data: None,
                        trial_end: None,
                        trial_from_plan: None,
                        trial_period_days: None,
                        trial_settings: None,
                    };
                    let stripe_subscription =
                        StripeSubscription::create(&self.stripe, subscription_params).await?;

                    let subscription = crate::models::subscription::ActiveModel {
                        user_id: Set(user_id),
                        plan: Set(req.plan),
                        stripe_customer_id: Set(Some(customer_id_str)),
                        stripe_subscription_id: Set(Some(stripe_subscription.id.to_string())),
                        status: Set(stripe_subscription.status.to_string()),
                        current_period_start: Set(chrono::DateTime::from_timestamp(
                            stripe_subscription.current_period_start,
                            0,
                        )
                        .ok_or(AppError::InternalServerError)?
                        .into()),
                        current_period_end: Set(chrono::DateTime::from_timestamp(
                            stripe_subscription.current_period_end,
                            0,
                        )
                        .ok_or(AppError::InternalServerError)?
                        .into()),
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
        let customer_params = CreateCustomer {
            email: Some(email),
            ..Default::default()
        };
        let customer = Customer::create(&self.stripe, customer_params).await?;
        Ok(customer)
    }

    pub async fn cancel_subscription(&self, user_id: i32) -> Result<(), AppError> {
        let subscription = self.get_user_subscription(user_id).await?;

        if let Some(stripe_subscription_id) = &subscription.stripe_subscription_id {
            // Cancel Stripe subscription
            let cancel_params = stripe::CancelSubscription::new();
            StripeSubscription::cancel(
                &self.stripe,
                &SubscriptionId::from_str(stripe_subscription_id)
                    .map_err(|_| AppError::InternalServerError)?,
                cancel_params,
            )
            .await?;
        }

        // Update local subscription to free plan
        let mut subscription: crate::models::subscription::ActiveModel = subscription.into();
        subscription.plan = Set(SubscriptionPlan::Free);
        subscription.status = Set("canceled".to_string());
        subscription.stripe_subscription_id = Set(None);
        subscription.update(&self.db).await?;

        Ok(())
    }

    pub async fn handle_webhook(
        &self,
        payload: &[u8],
        signature: &str,
        webhook_secret: &str,
    ) -> Result<(), AppError> {
        let payload_str = std::str::from_utf8(payload)
            .map_err(|_| AppError::BadRequest("Invalid webhook payload".into()))?;
        let event = stripe::Webhook::construct_event(payload_str, signature, webhook_secret)
            .map_err(|_| AppError::BadRequest("Invalid webhook signature".into()))?;

        match event.type_ {
            stripe::EventType::CustomerSubscriptionUpdated
            | stripe::EventType::CustomerSubscriptionDeleted => {
                if let stripe::EventObject::Subscription(stripe_subscription) = event.data.object {
                    let stripe_subscription_id = stripe_subscription.id.to_string();

                    // Update local subscription
                    if let Some(local_sub) = Subscription::find()
                        .filter(
                            crate::models::subscription::Column::StripeSubscriptionId
                                .eq(&stripe_subscription_id),
                        )
                        .one(&self.db)
                        .await?
                    {
                        let mut subscription: crate::models::subscription::ActiveModel =
                            local_sub.into();
                        subscription.status = Set(stripe_subscription.status.to_string());
                        subscription.update(&self.db).await?;
                    }
                }
            }
            _ => {}
        }

        Ok(())
    }
}
