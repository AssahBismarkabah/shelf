use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create users table
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Users::Email).string().not_null().unique_key())
                    .col(ColumnDef::new(Users::PasswordHash).string().not_null())
                    .col(ColumnDef::new(Users::FullName).string().not_null())
                    .col(ColumnDef::new(Users::IsAdmin).boolean().not_null().default(false))
                    .col(ColumnDef::new(Users::IsActive).boolean().not_null().default(true))
                    .col(
                        ColumnDef::new(Users::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Users::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create payment_status enum type
        manager.create_type(
            Type::create()
                .as_enum(PaymentStatus::Table)
                .values([
                    PaymentStatus::Pending,
                    PaymentStatus::Successful,
                    PaymentStatus::Failed,
                    PaymentStatus::Cancelled,
                ])
                .to_owned(),
        ).await?;

        // Create payment_provider enum type
        manager.create_type(
            Type::create()
                .as_enum(PaymentProvider::Table)
                .values([
                    PaymentProvider::MtnMomo,
                    PaymentProvider::Paypal,
                ])
                .to_owned(),
        ).await?;

        // Create payments table
        manager
            .create_table(
                Table::create()
                    .table(Payments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Payments::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Payments::UserId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-payments-user_id")
                            .from(Payments::Table, Payments::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .col(ColumnDef::new(Payments::ReferenceId).string().not_null().unique_key())
                    .col(ColumnDef::new(Payments::MtnReferenceId).string().not_null().unique_key())
                    .col(ColumnDef::new(Payments::Amount).decimal_len(10, 2).not_null())
                    .col(ColumnDef::new(Payments::Currency).string_len(3).not_null())
                    .col(ColumnDef::new(Payments::PhoneNumber).string_len(20).not_null())
                    .col(
                        ColumnDef::new(Payments::Provider)
                            .enumeration(PaymentProvider::Table, [
                                PaymentProvider::MtnMomo,
                                PaymentProvider::Paypal,
                            ])
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Payments::Status)
                            .enumeration(PaymentStatus::Table, [
                                PaymentStatus::Pending,
                                PaymentStatus::Successful,
                                PaymentStatus::Failed,
                                PaymentStatus::Cancelled,
                            ])
                            .not_null()
                            .default("pending"),
                    )
                    .col(ColumnDef::new(Payments::ProviderResponse).json_binary())
                    .col(ColumnDef::new(Payments::ErrorMessage).text())
                    .col(ColumnDef::new(Payments::Metadata).json_binary().default("{}"))
                    .col(
                        ColumnDef::new(Payments::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Payments::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create subscriptions table
        manager
            .create_table(
                Table::create()
                    .table(Subscriptions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Subscriptions::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Subscriptions::UserId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-subscriptions-user_id")
                            .from(Subscriptions::Table, Subscriptions::UserId)
                            .to(Users::Table, Users::Id),
                    )
                    .col(ColumnDef::new(Subscriptions::StripeCustomerId).string().not_null())
                    .col(ColumnDef::new(Subscriptions::StripeSubscriptionId).string().not_null())
                    .col(ColumnDef::new(Subscriptions::Status).string_len(50).not_null())
                    .col(ColumnDef::new(Subscriptions::Plan).string_len(50).not_null().default("none"))
                    .col(ColumnDef::new(Subscriptions::StorageLimitBytes).big_integer().not_null().default(0))
                    .col(ColumnDef::new(Subscriptions::CurrentPeriodEnd).timestamp_with_time_zone().not_null())
                    .col(
                        ColumnDef::new(Subscriptions::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Subscriptions::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create pdfs table
        manager
            .create_table(
                Table::create()
                    .table(Pdfs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Pdfs::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Pdfs::UserId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-pdfs-user_id")
                            .from(Pdfs::Table, Pdfs::UserId)
                            .to(Users::Table, Users::Id),
                    )
                    .col(ColumnDef::new(Pdfs::Title).string().not_null())
                    .col(ColumnDef::new(Pdfs::FilePath).string().not_null())
                    .col(ColumnDef::new(Pdfs::FileSize).big_integer().not_null())
                    .col(ColumnDef::new(Pdfs::Category).string_len(100))
                    .col(ColumnDef::new(Pdfs::Metadata).json_binary().not_null().default("{}"))
                    .col(
                        ColumnDef::new(Pdfs::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Pdfs::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create documents table
        manager
            .create_table(
                Table::create()
                    .table(Documents::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Documents::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Documents::UserId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-documents-user_id")
                            .from(Documents::Table, Documents::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .col(ColumnDef::new(Documents::Filename).string().not_null())
                    .col(ColumnDef::new(Documents::FileSize).big_integer().not_null())
                    .col(ColumnDef::new(Documents::MimeType).string_len(127).not_null())
                    .col(ColumnDef::new(Documents::S3Key).string().not_null().unique_key())
                    .col(
                        ColumnDef::new(Documents::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Documents::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Add indexes
        manager.create_index(Index::create().name("idx_user_email").table(Users::Table).col(Users::Email).to_owned()).await?;
        manager.create_index(Index::create().name("idx_pdf_user").table(Pdfs::Table).col(Pdfs::UserId).to_owned()).await?;
        manager.create_index(Index::create().name("idx_payments_user").table(Payments::Table).col(Payments::UserId).to_owned()).await?;
        manager.create_index(Index::create().name("idx_payments_reference").table(Payments::Table).col(Payments::ReferenceId).to_owned()).await?;
        manager.create_index(Index::create().name("idx_payments_status").table(Payments::Table).col(Payments::Status).to_owned()).await?;
        manager.create_index(Index::create().name("idx_subscription_user").table(Subscriptions::Table).col(Subscriptions::UserId).to_owned()).await?;
        manager.create_index(Index::create().name("idx_documents_user_id").table(Documents::Table).col(Documents::UserId).to_owned()).await?;
        manager.create_index(Index::create().name("idx_documents_s3_key").table(Documents::Table).col(Documents::S3Key).to_owned()).await?;

        // Create updated_at trigger function - This is typically handled by SeaORM's ActiveModelBehavior or by database defaults.
        // For simplicity, we'll rely on the default(Expr::current_timestamp()) and application-level logic for updates.
        // If a database trigger is strictly necessary, it would be more complex to manage via migrations directly
        // and might be better handled by executing raw SQL if SeaORM doesn't have a high-level abstraction for it.

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.drop_table(Table::drop().table(Documents::Table).if_exists().to_owned()).await?;
        manager.drop_table(Table::drop().table(Pdfs::Table).if_exists().to_owned()).await?;
        manager.drop_table(Table::drop().table(Subscriptions::Table).if_exists().to_owned()).await?;
        manager.drop_table(Table::drop().table(Payments::Table).if_exists().to_owned()).await?;
        manager.drop_type(Type::drop().name(PaymentProvider::Table).if_exists().to_owned()).await?;
        manager.drop_type(Type::drop().name(PaymentStatus::Table).if_exists().to_owned()).await?;
        manager.drop_table(Table::drop().table(Users::Table).if_exists().to_owned()).await?;
        Ok(())
    }
}

#[derive(Iden)]
enum Users {
    Table,
    Id,
    Email,
    PasswordHash,
    FullName,
    IsAdmin,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
#[iden = "payment_status"]
enum PaymentStatus {
    Table, // Represents the enum type name
    #[iden = "pending"] Pending,
    #[iden = "successful"] Successful,
    #[iden = "failed"] Failed,
    #[iden = "cancelled"] Cancelled,
}

#[derive(Iden)]
#[iden = "payment_provider"]
enum PaymentProvider {
    Table, // Represents the enum type name
    #[iden = "mtn_momo"] MtnMomo,
    #[iden = "paypal"] Paypal,
}

#[derive(Iden)]
enum Payments {
    Table,
    Id,
    UserId,
    ReferenceId,
    MtnReferenceId,
    Amount,
    Currency,
    PhoneNumber,
    Provider,
    Status,
    ProviderResponse,
    ErrorMessage,
    Metadata,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum Subscriptions {
    Table,
    Id,
    UserId,
    StripeCustomerId,
    StripeSubscriptionId,
    Status,
    Plan,
    StorageLimitBytes,
    CurrentPeriodEnd,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum Pdfs {
    Table,
    Id,
    UserId,
    Title,
    FilePath,
    FileSize,
    Category,
    Metadata,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum Documents {
    Table,
    Id,
    UserId,
    Filename,
    FileSize,
    MimeType,
    S3Key,
    CreatedAt,
    UpdatedAt,
}