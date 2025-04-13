use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

const UNLIMITED_STORAGE: i64 = i64::MAX; // Approximately 8 exabytes
const UNLIMITED_DOCUMENTS: i32 = i32::MAX; // Approximately 2 billion documents

#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "subscription_plan")]
pub enum SubscriptionPlan {
    #[sea_orm(string_value = "free")]
    Free,
    #[sea_orm(string_value = "basic")]
    Basic,
    #[sea_orm(string_value = "premium")]
    Premium,
}

impl SubscriptionPlan {
    pub fn storage_limit_bytes(&self) -> i64 {
        match self {
            SubscriptionPlan::Free => 100 * 1024 * 1024, // 100MB
            SubscriptionPlan::Basic => 10 * 1024 * 1024 * 1024, // 10GB
            SubscriptionPlan::Premium => UNLIMITED_STORAGE, // Unlimited (8 exabytes)
        }
    }

    pub fn document_limit(&self) -> i32 {
        match self {
            SubscriptionPlan::Free => 15,
            SubscriptionPlan::Basic => 150,
            SubscriptionPlan::Premium => UNLIMITED_DOCUMENTS, // Unlimited (2 billion)
        }
    }

    pub fn price_id(&self) -> Option<&'static str> {
        match self {
            SubscriptionPlan::Free => None,
            SubscriptionPlan::Basic => Some("price_basic_monthly"),
            SubscriptionPlan::Premium => Some("price_premium_monthly"),
        }
    }
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subscriptions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub user_id: i32,
    pub plan: SubscriptionPlan,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub status: String,
    pub current_period_start: DateTimeWithTimeZone,
    pub current_period_end: DateTimeWithTimeZone,
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub created_at: DateTimeWithTimeZone,
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
