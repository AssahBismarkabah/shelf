use crate::error::AppError;
use crate::models::document::{Entity as Document, Model as DocumentModel};
use crate::models::subscription::Entity as Subscription;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    Set,
};
use serde::{Deserialize, Serialize};

const UNLIMITED_STORAGE: i64 = i64::MAX;
const UNLIMITED_DOCUMENTS: i32 = i32::MAX;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub filename: String,
    pub mime_type: String,
}

pub struct DocumentService {
    pub db: DatabaseConnection,
    pub storage_service: crate::services::storage::StorageService,
}

impl DocumentService {
    pub fn new(
        db: DatabaseConnection,
        storage_service: crate::services::storage::StorageService,
    ) -> Self {
        Self {
            db,
            storage_service,
        }
    }

    async fn check_storage_limit(&self, user_id: i32, file_size: i64) -> Result<(), AppError> {
        let subscription = Subscription::find()
            .filter(crate::models::subscription::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("Subscription not found".into()))?;

        let storage_limit = subscription.plan.storage_limit_bytes();

        // Skip check if unlimited storage
        if storage_limit == UNLIMITED_STORAGE {
            return Ok(());
        }

        // Get total storage used
        let total_storage: i64 = Document::find()
            .filter(crate::models::document::Column::UserId.eq(user_id))
            .all(&self.db)
            .await?
            .iter()
            .map(|doc| doc.file_size)
            .sum();

        // Check if adding new file would exceed limit
        if total_storage + file_size > storage_limit {
            return Err(AppError::Forbidden("Storage limit exceeded".into()));
        }

        Ok(())
    }

    async fn check_document_limit(&self, user_id: i32) -> Result<(), AppError> {
        let subscription = Subscription::find()
            .filter(crate::models::subscription::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("Subscription not found".into()))?;

        let document_limit = subscription.plan.document_limit();

        // Skip check if unlimited documents
        if document_limit == UNLIMITED_DOCUMENTS {
            return Ok(());
        }

        // Get total documents
        let total_documents = Document::find()
            .filter(crate::models::document::Column::UserId.eq(user_id))
            .count(&self.db)
            .await?;

        // Check if adding new document would exceed limit
        if total_documents >= document_limit as u64 {
            return Err(AppError::Forbidden("Document limit exceeded".into()));
        }

        Ok(())
    }

    pub async fn create_document(
        &self,
        user_id: i32,
        req: CreateDocumentRequest,
        file: impl tokio::io::AsyncRead + Send + Unpin + 'static,
        file_size: i64,
    ) -> Result<DocumentModel, AppError> {
        // Check subscription limits
        self.check_storage_limit(user_id, file_size).await?;
        self.check_document_limit(user_id).await?;

        // Generate unique S3 key
        let s3_key = format!("{}/{}", user_id, uuid::Uuid::new_v4());

        // Upload to storage
        self.storage_service
            .upload_file(&s3_key, &req.mime_type, file)
            .await?;

        // Create document record
        let document = crate::models::document::ActiveModel {
            user_id: Set(user_id),
            filename: Set(req.filename),
            file_size: Set(file_size),
            mime_type: Set(req.mime_type),
            s3_key: Set(s3_key),
            ..Default::default()
        };

        let document = document.insert(&self.db).await?;

        Ok(document)
    }

    pub async fn get_document(&self, id: i32, user_id: i32) -> Result<DocumentModel, AppError> {
        let document = Document::find()
            .filter(crate::models::document::Column::Id.eq(id))
            .filter(crate::models::document::Column::UserId.eq(user_id))
            .one(&self.db)
            .await?
            .ok_or(AppError::NotFound("Document not found".into()))?;

        Ok(document)
    }

    pub async fn list_documents(&self, user_id: i32) -> Result<Vec<DocumentModel>, AppError> {
        let documents = Document::find()
            .filter(crate::models::document::Column::UserId.eq(user_id))
            .all(&self.db)
            .await?;

        Ok(documents)
    }

    pub async fn delete_document(&self, id: i32, user_id: i32) -> Result<(), AppError> {
        let document = self.get_document(id, user_id).await?;

        // Delete from storage
        self.storage_service.delete_file(&document.s3_key).await?;

        // Delete from database
        Document::delete_by_id(id).exec(&self.db).await?;

        Ok(())
    }

    pub async fn download_document(
        &self,
        id: i32,
        user_id: i32,
    ) -> Result<
        std::pin::Pin<
            Box<dyn futures_util::Stream<Item = Result<bytes::Bytes, std::io::Error>> + Send>,
        >,
        AppError,
    > {
        let document = self.get_document(id, user_id).await?;
        Ok(self
            .storage_service
            .download_file(&document.s3_key)
            .await
            .map_err(AppError::from)?)
    }
}
