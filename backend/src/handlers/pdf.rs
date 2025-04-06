// use actix_web::{HttpResponse, web};
// use actix_multipart::Multipart;
// use futures_util::StreamExt;
// use chrono::Utc;
// use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set}; // Import EntityTrait
// use crate::config::app_config::create_s3_client;
// use crate::services::storage;
// use crate::models::pdf;
// use crate::models::pdf::ActiveModel;
// use crate::middleware::user_id::UserId;  // Import the custom UserId
// use std::sync::Arc;


// pub async fn upload_pdf(mut payload: Multipart, pool: web::Data<Arc<sea_orm::DatabaseConnection>>, user_id: i32) -> HttpResponse {
//     let s3 = create_s3_client().await;
//     let bucket = format!("user-{}", user_id);  // Dynamically use user ID for bucket name

//     while let Some(item) = payload.next().await {
//         let mut field = match item {
//             Ok(field) => field,
//             Err(_) => return HttpResponse::BadRequest().body("Invalid multipart field"),
//         };

//         let filename = field
//             .content_disposition()
//             .and_then(|cd| cd.get_filename().map(|f| f.to_string()))
//             .unwrap_or_else(|| format!("file-{}.pdf", Utc::now().timestamp()));

//         let mut data = web::BytesMut::new();

//         while let Some(chunk) = field.next().await {
//             match chunk {
//                 Ok(bytes) => data.extend_from_slice(&bytes),
//                 Err(_) => return HttpResponse::InternalServerError().body("Error reading chunk"),
//             }
//         }

//         // Upload the file to MinIO
//         let result = storage::upload_file(
//             &s3,
//             &bucket,
//             &filename,
//             "application/pdf",
//             data.to_vec(),
//         ).await;

//         if result.is_err() {
//             return HttpResponse::InternalServerError().body("Error uploading file to MinIO");
//         }

//         // Save file metadata to PostgreSQL
//         let pdf_metadata = pdf::ActiveModel {
//             user_id: Set(user_id),
//             title: Set(filename.clone()),
//             file_path: Set(format!("{}/{}", bucket, filename)), // Store the S3 path
//             file_size: Set(data.len() as i64),
//             category: Set(None),  // Optionally set based on your use case
//             metadata: Set(serde_json::json!({})),  // You can store additional metadata here
//             created_at: Set(Utc::now().into()),
//             updated_at: Set(Utc::now().into()),
//             ..Default::default()
//         };

//         // Dereference `Arc` to get the `DatabaseConnection`
// // Dereference Arc to get the actual DatabaseConnection
// let db_connection: &DatabaseConnection = &**pool;

// // Insert into the database
// let insert_result = pdf::Entity::insert(pdf_metadata).exec(db_connection).await;

//         if let Err(e) = insert_result {
//             return HttpResponse::InternalServerError().body(format!("Error saving metadata: {:?}", e));
//         }
//     }

//     HttpResponse::Ok().body("Upload successful.")
// }





// pub async fn download_pdf(path: web::Path<String>, pool: web::Data<Arc<DatabaseConnection>>) -> HttpResponse {
//     // Extract filename or file_id from the path
//     let filename = path.into_inner();

//     // Dereference the pool to get the actual connection
//     let db_conn: &DatabaseConnection = &**pool;

//     // Fetch the file metadata from PostgreSQL
//     let pdf_record = pdf::Entity::find()
//         .filter(pdf::Column::Title.eq(filename.clone())) // Assuming filename is stored as 'title' in the database
//         .one(db_conn) // Use the dereferenced connection here
//         .await;

//     match pdf_record {
//         Ok(Some(record)) => {
//             // Check if file_path is empty and provide a fallback
//             let file_path = if record.file_path.is_empty() {
//                 "".to_string() // Fallback to empty string if file_path is empty
//             } else {
//                 record.file_path // Use the actual file_path if it's not empty
//             };

//             let s3 = create_s3_client().await;
//             let bucket = "user-bucket";  // Adjust this to be user-specific, if needed

//             // Download the file from MinIO
//             match storage::download_file(&s3, bucket, &file_path).await {
//                 Ok(data) => {
//                     // Return the file to the user as a response
//                     HttpResponse::Ok()
//                         .content_type("application/pdf")
//                         .body(data)
//                 },
//                 Err(err) => {
//                     eprintln!("Error downloading file from MinIO: {:?}", err);
//                     HttpResponse::InternalServerError().body("Error downloading file")
//                 }
//             }
//         },
//         Ok(None) => {
//             // No record found for the requested file
//             HttpResponse::NotFound().body("File not found")
//         },
//         Err(err) => {
//             eprintln!("Error retrieving file metadata: {:?}", err);
//             HttpResponse::InternalServerError().body("Error fetching file metadata")
//         }
//     }
// }













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
