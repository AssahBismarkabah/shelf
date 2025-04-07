

use actix_web::{web, HttpMessage, HttpResponse};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use chrono::Utc;
use sea_orm::{DatabaseConnection, EntityTrait, Set};
use std::sync::Arc;
use crate::models::pdf;
use crate::services::storage;
use crate::config::app_config::create_s3_client;

pub async fn upload_pdf(
    mut payload: Multipart,
    pool: web::Data<DatabaseConnection>,
    req: actix_web::HttpRequest,
) -> HttpResponse {
    let user_id = match req.extensions().get::<i32>() {
        Some(id) => *id,
        None => return HttpResponse::Unauthorized().body("User ID missing"),
    };

    let s3 = create_s3_client().await;
    let bucket = format!("user-{}", user_id);

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(_) => return HttpResponse::BadRequest().body("Invalid multipart field"),
        };

        let filename = field.content_disposition()
            .and_then(|cd| cd.get_filename().map(String::from))
            .unwrap_or_else(|| format!("file-{}.pdf", Utc::now().timestamp()));

        let mut data = web::BytesMut::new();
        while let Some(chunk) = field.next().await {
            match chunk {
                Ok(bytes) => data.extend_from_slice(&bytes),
                Err(_) => return HttpResponse::InternalServerError().body("Error reading chunk"),
            }
        }

        if let Err(e) = storage::upload_file(&s3, &bucket, &filename, "application/pdf", data.to_vec()).await {
            return HttpResponse::InternalServerError().body(format!("S3 upload error: {:?}", e));
        }

        let pdf_metadata = pdf::ActiveModel {
            user_id: Set(user_id),
            title: Set(filename.clone()),
            file_path: Set(format!("{}/{}", bucket, filename)),
            file_size: Set(data.len() as i64),
            category: Set(None),
            metadata: Set(serde_json::json!({})),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            ..Default::default()
        };
        let db_connection: &DatabaseConnection = &**pool;

 let insert_result = pdf::Entity::insert(pdf_metadata).exec(db_connection).await;

        if let Err(e) = insert_result{
            return HttpResponse::InternalServerError().body(format!("DB error: {:?}", e));
        }
    }

    HttpResponse::Ok().body("Upload successful")
}

pub async fn download_pdf(
    filename: web::Path<String>,
) -> HttpResponse {
    HttpResponse::Ok().body(format!("You requested file: {}", filename))
}
