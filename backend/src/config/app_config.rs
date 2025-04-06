use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, Config};
use aws_sdk_s3::config::Region;
use aws_credential_types::Credentials;

pub async fn create_s3_client() -> Client {
    let endpoint = std::env::var("S3_ENDPOINT").expect("S3_ENDPOINT must be set");
    let access_key = std::env::var("S3_ACCESS_KEY").expect("S3_ACCESS_KEY must be set");
    let secret_key = std::env::var("S3_SECRET_KEY").expect("S3_SECRET_KEY must be set");

    let region = Region::new("us-east-1");
    let credentials = Credentials::new(access_key, secret_key, None, None, "static");

    let config = Config::builder()
        .credentials_provider(credentials)
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url(endpoint)
        .region(region)
        .build();

    Client::from_conf(config)
}
