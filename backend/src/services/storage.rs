use aws_sdk_s3::{primitives::ByteStream, Client};



pub async fn upload_file(
    client: &Client,
    bucket: &str,
    key: &str,
    content_type: &str,
    bytes: Vec<u8>,
) -> Result<(), aws_sdk_s3::Error> {
    client.put_object()
        .bucket(bucket)
        .key(key)
        .body(ByteStream::from(bytes))
        .content_type(content_type)
        .send()
        .await?;

    Ok(())
}
