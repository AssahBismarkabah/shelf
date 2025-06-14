pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_initial_tables;
// Add more migration modules here, e.g.:
// mod m20220101_000002_create_another_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_initial_tables::Migration),
            // Add more migrations here, e.g.:
            // Box::new(m20220101_000002_create_another_table::Migration),
        ]
    }
}