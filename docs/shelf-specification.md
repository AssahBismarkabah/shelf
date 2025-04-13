Cloud-Based PDF Management & Subscription Platform

1. Project Overview

A cloud-based platform designed to allow users to upload, store, read, and manage PDFs, including books and personal notes. The platform follows a subscription-based model where users pay $10 per month for access.

2. Core Features

2.1 User Features

Authentication & User Management

User registration & login (email/password)

OAuth support (Google, GitHub, etc.)

Two-Factor Authentication (2FA)

Account settings management

PDF Upload & Management

Upload PDFs (books, notes, etc.)

Organize PDFs into folders/categories

Rename or delete PDFs

Secure file storage with metadata support

PDF Reading & Annotation

View PDFs in-browser (using PDF.js or an alternative renderer)

Search within PDFs

Bookmark pages

Highlight text and add personal notes

Subscription & Payments

$10/month subscription fee

Stripe/PayPal integration for payments

Automatic subscription renewal

Subscription management (cancel, pause, resume)

User Dashboard

Manage uploaded PDFs

Track subscription status

2.2 Admin Features

User Management

View and edit user accounts

Suspend/ban users

Subscription & Billing Management

Monitor active subscribers

Handle refunds and cancellations

Storage & Performance Monitoring

Track storage usage per user

Optimize storage solutions

3. Technical Stack

3.1 Backend (Rust-Based)

Framework: Actix Web / Rocket

Database: PostgreSQL (Diesel ORM / SeaORM)

Authentication: JWT-based authentication

File Storage: AWS S3 / MinIO / Self-hosted storage

Asynchronous Processing: Tokio (for background tasks)

Payment Integration: Stripe / PayPal API

3.2 Frontend

Framework: React.js / Svelte

UI Library: Tailwind CSS / Material UI

PDF Viewing: PDF.js

State Management: Redux / Zustand / TanStack Query

3.3 Infrastructure

Hosting: AWS EC2 / DigitalOcean / Linode

Containerization: Docker & Kubernetes (K3s for lightweight deployment)

CI/CD: GitHub Actions / GitLab CI

Logging & Monitoring: Prometheus + Grafana / ELK Stack

4. Security Considerations

Data Encryption

PDFs stored with AES-256 encryption at rest

TLS encryption for data transmission

Access Control

Role-Based Access Control (RBAC) for users/admins

Secure Payments

PCI-compliant transactions with Stripe/PayPal

5. Implementation Roadmap

Phase 1: MVP Development (3 Months)

Implement authentication & user management

Develop file upload & storage system

Build basic PDF reader

Integrate Stripe for subscriptions

Phase 2: Feature Expansion (2-3 Months)

Add annotation & search features

Implement folder organization

Improve UI/UX

Phase 3: Scaling & Optimization (Ongoing)

Deploy to production

Monitor performance & security

Optimize cloud costs

6. Conclusion

This project aims to provide a scalable, secure, and user-friendly platform for managing and reading PDFs online. By leveraging Rust for backend efficiency and React for frontend responsiveness, the platform ensures an optimal experience for users while maintaining data security, ease of use, and financial sustainability through a subscription model.

---

## Database Example Queries (via PgAdmin)

Here are sample queries to inspect data from the key tables in the Shelf database:

### 🔍 Query the `users` Table

```sql
SELECT id, email, full_name, is_admin, is_active, created_at, updated_at
FROM users;
```


- Query the documents Table
```sql
SELECT id, user_id, filename, file_size, mime_type, s3_key, created_at, updated_at
FROM documents;
```

