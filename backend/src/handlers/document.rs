use crate::{
    middleware::auth::AuthenticatedUser,
    models::document::{self, Entity as Document},
    services::storage::StorageService,
};
use actix_multipart::Multipart;
use actix_web::{web, Error, HttpResponse};
use futures_util::TryStreamExt;
use sanitize_filename::sanitize;
use sea_orm::{ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::path::Path;
use uuid::Uuid;

pub async fn upload_document(
    db: web::Data<DatabaseConnection>,
    storage: web::Data<StorageService>,
    mut payload: Multipart,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    while let Some(mut field) = payload.try_next().await? {
        let content_disposition = field.content_disposition();

        let filename = content_disposition
            .and_then(|cd| cd.get_filename())
            .map(|f| sanitize(f))
            .ok_or_else(|| actix_web::error::ErrorBadRequest("No filename provided"))?;

        let content_type = field
            .content_type()
            .map(|t| t.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        // Get the file extension
        let extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        // Include the file extension in the S3 key
        let s3_key = format!("{}/{}.{}", user.id, Uuid::new_v4(), extension);

        // Read the file data into a buffer
        let mut size: i64 = 0;
        let mut buffer = Vec::new();
        while let Some(chunk) = field.try_next().await? {
            size += chunk.len() as i64;
            buffer.extend_from_slice(&chunk);
        }

        // Upload to S3
        storage
            .upload_file(&s3_key, &content_type, std::io::Cursor::new(buffer.clone()))
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

        // Save to database
        let document = document::ActiveModel {
            user_id: Set(user.id),
            filename: Set(filename),
            file_size: Set(size),
            mime_type: Set(content_type),
            s3_key: Set(s3_key),
            ..Default::default()
        };

        Document::insert(document)
            .exec(db.get_ref())
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "File uploaded successfully"
    })))
}

pub async fn download_document(
    db: web::Data<DatabaseConnection>,
    storage: web::Data<StorageService>,
    path: web::Path<i32>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let document_id = path.into_inner();

    let document = Document::find_by_id(document_id)
        .filter(document::Column::UserId.eq(user.id))
        .one(db.get_ref())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?
        .ok_or_else(|| actix_web::error::ErrorNotFound("Document not found"))?;

    let stream = storage
        .download_file(&document.s3_key)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok()
        .append_header((
            "Content-Disposition",
            format!("attachment; filename=\"{}\"", document.filename),
        ))
        .append_header(("Content-Type", document.mime_type))
        .append_header(("Content-Length", document.file_size.to_string()))
        .streaming(stream))
}

pub async fn list_documents(
    db: web::Data<DatabaseConnection>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let documents = Document::find()
        .filter(document::Column::UserId.eq(user.id))
        .all(db.get_ref())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(documents))
}

pub async fn delete_document(
    db: web::Data<DatabaseConnection>,
    storage: web::Data<StorageService>,
    path: web::Path<i32>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let document_id = path.into_inner();

    let document = Document::find_by_id(document_id)
        .filter(document::Column::UserId.eq(user.id))
        .one(db.get_ref())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?
        .ok_or_else(|| actix_web::error::ErrorNotFound("Document not found"))?;

    // Delete from S3
    storage
        .delete_file(&document.s3_key)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    // Delete from database
    Document::delete_by_id(document_id)
        .exec(db.get_ref())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Document deleted successfully"
    })))
}
