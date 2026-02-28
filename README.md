# MUZICC

A cloud-native web application for managing a personal music library.

This repository includes:
- **Backend**: FastAPI + PostgreSQL + JWT + S3/CloudFront
- **Frontend**: React + TypeScript + Vite + Zustand
- **Platform/CI**: Docker, Jenkins, Trivy, SonarQube, OPA policy, ECR, S3, CloudFront

---

## 1) Key Features

### Users
- Register and log in with email/password
- JWT Bearer token authentication

### Songs
- Public song listing (accessible to everyone)
- My songs listing (requires authentication)
- Search by song title (and artist on the My Music page)
- Create/update/soft-delete songs
- Global audio player with automatic next-track behavior via queue
- Download songs from the UI

### Audio Upload to S3
- Upload flow via **presigned URL**
- Only `audio/mpeg` is accepted
- SHA256-based deduplication (`file_hash`) to reuse existing objects
- Store `s3_key` in DB, and generate playback URL dynamically based on config (CloudFront / public S3 / presigned GET)

---

## 2) Architecture Overview

### Backend (FastAPI)
- API prefix: `/api`
- Routers:
  - `/api/health`
  - `/api/auth`
  - `/api/songs`
- ORM: SQLAlchemy
- DB: PostgreSQL
- Auth: JWT (HS256), Argon2 password hashing (passlib)
- Storage: AWS S3 (IRSA-ready for EKS environments)

### Frontend (React)
- Router:
  - Public: `/`, `/login`, `/register`
  - Authenticated: `/home`, `/my-music`
- State management: Zustand (`auth`, `audio`, `toast`)
- API client: Axios with automatic `Authorization` header injection

### CI/CD (Jenkins)
Current pipeline stages:
1. Checkout
2. Trivy filesystem scan
3. SonarQube scan for backend + frontend
4. Build backend Docker image
5. Trivy image scan
6. OPA policy check (disallow `:latest`, enforce image tags)
7. Push backend image to ECR
8. Build frontend static assets
9. Upload `frontend/dist` to S3
10. Invalidate CloudFront cache
11. Send Slack notifications

---

## 3) Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   └── services/
│   ├── migrations/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── policies/
│   └── muzicc.rego
├── docker-compose.yml
└── Jenkinsfile
```

---

## 4) Backend Environment Variables

Backend settings are loaded from `backend/.env` (via `pydantic-settings`).

Main variables:
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM` (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default: `60`)
- `S3_BUCKET`
- `S3_REGION` (default: `ap-southeast-1`)
- `S3_PUBLIC` (`true/false`)
- `CLOUDFRONT_URL` (if set, CDN URL is preferred for playback)

Minimal local example:

```env
DATABASE_URL=postgresql://muzicc:muzicc@localhost:5432/muzicc
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

S3_BUCKET=your-bucket
S3_REGION=ap-southeast-1
S3_PUBLIC=false
CLOUDFRONT_URL=
```

---

## 5) Local Run

## Option A: Run services separately (recommended for development)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs at `http://localhost:5173` by default.

## Option B: Docker Compose (local integration)
```bash
docker compose up --build
```

The compose file currently defines 3 services: `db`, `backend`, `frontend`.

---

## 6) Main API Endpoints

### Health
- `GET /api/health/`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Songs
- Public:
  - `GET /api/songs`
  - `GET /api/songs/{song_id}`
- Auth:
  - `GET /api/songs/me`
  - `POST /api/songs`
  - `PUT /api/songs/{song_id}`
  - `DELETE /api/songs/{song_id}` (soft delete)

### Upload & dedup
- `POST /api/songs/check-file`
- `POST /api/songs/upload-url`
- `POST /api/songs/confirm-upload`

Recommended frontend flow:
1. Compute SHA256 hash of the file
2. Call `check-file`
3. If not found, call `upload-url` and upload to S3 using the presigned URL
4. Call `create song` with `object_key` and `file_hash`

---

## 7) Database & Migrations

Core models:
- `users`
- `songs`

Manual SQL migrations are available in `backend/migrations/`:
- `add_s3_key_file_url.sql`
- `add_file_hash_to_songs.sql`

`init_db()` currently uses `Base.metadata.create_all()` to create schema on app startup.

---

## 8) Security & Policy

- Password hashing: Argon2
- JWT auth for private APIs
- OPA policy at `policies/muzicc.rego`:
  - Disallow image tag `latest`
  - Require every image to include a tag
- Trivy scans source and image in CI
- SonarQube scans backend/frontend in CI

---

## 9) Project Roadmap (Original Plan)

- Phase 0: Repository discipline & security
- Phase 1: Backend development (local)
- Phase 2: Frontend development (local)
- Phase 3: Docker & local integration
- Phase 4: CI pipeline
- Phase 5: Cloud deployment (AWS + EKS)
- Phase 6: Test pipeline

---

## 10) Notes

- This repo currently focuses on an end-to-end learning flow: from local development to CI/CD and cloud deployment.
- You can split additional docs for backend/frontend if deeper API schema and EKS deployment architecture documentation is needed.
