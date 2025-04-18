use crate::{
    error::AppError,
    models::payment::{Entity as Payment, Model as PaymentModel, PaymentProvider, PaymentStatus},
};
use mtnmomo::{Currency, Momo, Party, PartyIdType, RequestToPay};
use sea_orm::prelude::Decimal;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use sea_orm::{ColumnTrait, QueryFilter};
use serde_json::json;
use std::env;
use std::str::FromStr;
use std::sync::Arc;

#[derive(Clone)]
pub struct PaymentService {
    momo: Arc<Momo>,
    collection_primary_key: String,
    collection_secondary_key: String,
    db: DatabaseConnection,
}

impl PaymentService {
    pub async fn new(db: DatabaseConnection) -> Result<Self, AppError> {
        let mtn_url =
            env::var("MTN_URL").map_err(|_| AppError::BadRequest("MTN_URL must be set".into()))?;
        let primary_key = env::var("MTN_COLLECTION_PRIMARY_KEY")
            .map_err(|_| AppError::BadRequest("MTN_COLLECTION_PRIMARY_KEY must be set".into()))?;
        let secondary_key = env::var("MTN_COLLECTION_SECONDARY_KEY")
            .map_err(|_| AppError::BadRequest("MTN_COLLECTION_SECONDARY_KEY must be set".into()))?;

        let momo = Momo::new_with_provisioning(mtn_url, primary_key.clone())
            .await
            .map_err(|e| AppError::BadRequest(format!("Failed to initialize MTN MoMo: {}", e)))?;

        Ok(Self {
            momo: Arc::new(momo),
            collection_primary_key: primary_key,
            collection_secondary_key: secondary_key,
            db,
        })
    }

    pub async fn request_payment(
        &self,
        user_id: i32,
        amount: String,
        phone_number: String,
        payer_message: String,
        payee_note: String,
    ) -> Result<PaymentModel, AppError> {
        if !phone_number.starts_with("237") || phone_number.len() != 12 {
            return Err(AppError::BadRequest("Invalid phone number format".into()));
        }

        let amount_decimal = Decimal::from_str(&amount)
            .map_err(|_| AppError::BadRequest("Invalid amount format".into()))?;
        if amount_decimal <= Decimal::ZERO {
            return Err(AppError::BadRequest("Amount must be greater than 0".into()));
        }

        let collection = self.momo.collection(
            self.collection_primary_key.clone(),
            self.collection_secondary_key.clone(),
        );

        let payer = Party {
            party_id_type: PartyIdType::MSISDN,
            party_id: phone_number.clone(),
        };

        let request = RequestToPay::new(
            amount.clone(),
            Currency::XAF,
            payer,
            payer_message.clone(),
            payee_note.clone(),
        );

        // Save payment to DB (reference_id is generated after success)
        let payment = crate::models::payment::ActiveModel {
            user_id: Set(user_id),
            reference_id: Set("".to_string()), // To be filled in later
            amount: Set(amount_decimal.into()),
            currency: Set("XAF".to_string()),
            phone_number: Set(phone_number.clone()),
            provider: Set(PaymentProvider::MtnMomo),
            status: Set(PaymentStatus::Pending),
            provider_response: Set(None),
            error_message: Set(None),
            metadata: Set(json!({
                "payer_message": payer_message,
                "payee_note": payee_note
            })),
            ..Default::default()
        };

        let inserted_payment = payment.insert(&self.db).await?;

        match collection.request_to_pay(request).await {
            Ok(reference_id) => {
                let mut active_payment: crate::models::payment::ActiveModel =
                    inserted_payment.into();
                active_payment.reference_id = Set(reference_id.as_string());
                active_payment.provider_response = Set(Some(json!({
                    "reference_id": reference_id.as_string(),
                    "status": "PENDING"
                })));

                Ok(active_payment.update(&self.db).await?)
            }
            Err(e) => {
                let mut failed_payment: crate::models::payment::ActiveModel =
                    inserted_payment.into();
                failed_payment.status = Set(PaymentStatus::Failed);
                failed_payment.error_message = Set(Some(e.to_string()));
                failed_payment.update(&self.db).await?;

                Err(AppError::InternalServerError(format!(
                    "Payment request failed: {}",
                    e
                )))
            }
        }
    }

    pub async fn check_payment_status(
        &self,
        reference_id: String,
    ) -> Result<PaymentModel, AppError> {
        let payment = Payment::find()
            .filter(crate::models::payment::Column::ReferenceId.eq(reference_id.clone()))
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("Payment not found".into()))?;

        let collection = self.momo.collection(
            self.collection_primary_key.clone(),
            self.collection_secondary_key.clone(),
        );

        match collection
            .request_to_pay_transaction_status(&reference_id)
            .await
        {
            Ok(status) => {
                let mut updated_payment: crate::models::payment::ActiveModel = payment.into();
                updated_payment.status = Set(match status.status.as_str() {
                    "SUCCESSFUL" => PaymentStatus::Successful,
                    "FAILED" => PaymentStatus::Failed,
                    "CANCELLED" => PaymentStatus::Cancelled,
                    _ => PaymentStatus::Pending,
                });
                updated_payment.provider_response = Set(Some(json!({
                    "reference_id": reference_id,
                    "status": status.status
                })));

                Ok(updated_payment.update(&self.db).await?)
            }
            Err(e) => {
                let mut failed_payment: crate::models::payment::ActiveModel = payment.into();
                failed_payment.status = Set(PaymentStatus::Failed);
                failed_payment.error_message = Set(Some(format!("Status check failed: {}", e)));
                failed_payment.update(&self.db).await?;

                Err(AppError::InternalServerError(format!(
                    "Status check failed: {}",
                    e
                )))
            }
        }
    }
}
