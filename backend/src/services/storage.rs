use aws_config::Region;
use aws_sdk_s3::config::Builder;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use bytes::Bytes;
use futures_util::Stream;
use std::error::Error;
use std::io::Error as IoError;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncRead;
use tokio_util::io::ReaderStream;

#[derive(Clone)]
pub struct StorageService {
    client: Arc<Client>,
    bucket: String,
}

impl StorageService {
    pub async fn new(endpoint: String, bucket: String) -> Result<Self, Box<dyn Error>> {
        println!("Initializing storage service with endpoint: {}", endpoint);
        println!("Using bucket: {}", bucket);

        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .endpoint_url(endpoint)
            .region(Region::new("us-east-1"))
            .load()
            .await;

        let s3_config = Builder::from(&config).force_path_style(true).build();

        let client = Arc::new(Client::from_conf(s3_config));

        // Ensure bucket exists
        let service = Self {
            client,
            bucket: bucket.clone(),
        };
        service.ensure_bucket_exists().await?;

        Ok(service)
    }

    async fn ensure_bucket_exists(&self) -> Result<(), Box<dyn Error>> {
        println!("Checking if bucket exists: {}", self.bucket);

        // Try to get bucket location to check if it exists
        match self
            .client
            .get_bucket_location()
            .bucket(&self.bucket)
            .send()
            .await
        {
            Ok(_) => {
                println!("Bucket already exists: {}", self.bucket);
                Ok(())
            }
            Err(_) => {
                println!("Creating bucket: {}", self.bucket);
                self.client
                    .create_bucket()
                    .bucket(&self.bucket)
                    .send()
                    .await?;
                println!("Bucket created successfully: {}", self.bucket);
                Ok(())
            }
        }
    }

    pub async fn upload_file<R>(
        &self,
        key: &str,
        content_type: &str,
        mut body: R,
    ) -> Result<(), Box<dyn Error>>
    where
        R: AsyncRead + Send + Unpin + 'static,
    {
        println!("Uploading file to S3: {}", key);
        println!("Content type: {}", content_type);
        println!("Bucket: {}", self.bucket);

        let mut buffer = Vec::new();
        tokio::io::copy(&mut body, &mut buffer).await?;

        println!("File size: {} bytes", buffer.len());

        let body = ByteStream::from(buffer);

        let result = self
            .client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .body(body)
            .send()
            .await?;

        println!("Upload result: {:?}", result);

        Ok(())
    }

    pub async fn download_file(
        &self,
        key: &str,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<Bytes, IoError>> + Send>>, Box<dyn Error>> {
        println!("Downloading file from S3: {}", key);
        println!("Bucket: {}", self.bucket);

        let result = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        println!("Download result: {:?}", result);

        let async_read = result.body.into_async_read();
        let buffered_reader = tokio::io::BufReader::new(async_read);
        let stream = ReaderStream::new(buffered_reader);

        Ok(Box::pin(stream))
    }

    pub async fn delete_file(&self, key: &str) -> Result<(), Box<dyn Error>> {
        println!("Deleting file from S3: {}", key);
        println!("Bucket: {}", self.bucket);

        let result = self
            .client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        println!("Delete result: {:?}", result);

        Ok(())
    }
}
