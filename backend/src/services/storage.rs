use aws_config::Region;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use bytes::Bytes;
use futures_util::Stream;
use std::error::Error;
use std::io::Error as IoError;
use std::pin::Pin;
use std::sync::Arc;
use tokio::io::AsyncRead;
use tokio_util::io::ReaderStream; // Add this for ReaderStream // Ensure Bytes is imported

#[derive(Clone)]
pub struct StorageService {
    client: Arc<Client>,
    bucket: String,
}

impl StorageService {
    pub async fn new(endpoint: String, bucket: String) -> Result<Self, Box<dyn Error>> {
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .endpoint_url(endpoint)
            .region(Region::new("us-east-1"))
            .load()
            .await;

        let client = Arc::new(Client::new(&config));

        Ok(Self { client, bucket })
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
        let mut buffer = Vec::new();
        tokio::io::copy(&mut body, &mut buffer).await?;

        let body = ByteStream::from(buffer);

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .body(body)
            .send()
            .await?;

        Ok(())
    }

    pub async fn download_file(
        &self,
        key: &str,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<Bytes, IoError>> + Send>>, Box<dyn Error>> {
        let result = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        let async_read = result.body.into_async_read();
        let buffered_reader = tokio::io::BufReader::new(async_read);
        let stream = ReaderStream::new(buffered_reader);

        Ok(Box::pin(stream))
    }

    pub async fn delete_file(&self, key: &str) -> Result<(), Box<dyn Error>> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        Ok(())
    }
}
