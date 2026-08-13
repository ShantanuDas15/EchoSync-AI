# EchoSync AI: Database Architecture Alignment & Workspace Refactoring Plan (Phase 1)

---

## Executive Overview

**EchoSync AI** is a state-of-the-art, decoupled zero-shot neural voice cloning and text-to-speech engine. Following the specification of the **Enterprise Database Architecture & Schema Specification** ([`docs/architecture/DATABASE_DESIGN.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/docs/architecture/DATABASE_DESIGN.md)), this **Phase 1 Database Alignment Plan** outlines the comprehensive engineering workflow required to refactor, upgrade, and synchronize all workspace code—including SQLAlchemy ORM models, Pydantic V2 schemas, Supabase data services, Celery task lifecycle trackers, FastAPI control endpoints, and automated Pytest harnesses—with the production database design.

The primary objective is to transform transient and mock data flows into a resilient, production-grade persistence architecture capable of sub-15ms vector similarity queries across 1,000,000+ speaker embeddings while guaranteeing zero data loss, strict tenant isolation via Row-Level Security (RLS), and zero-downtime schema scalability.

---

## Section A: Architectural Topology & Data Persistence Flow

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                      FRONTEND PRESENTATION LAYER (Vercel Edge)                                        |
|  +------------------------------------+  +-----------------------------------+  +----------------------------------+  |
|  |     Next.js 14 Dashboard UI        |  |  Clerk / NextAuth Authentication  |  |    WaveSurfer.js Visualizer      |  |
|  +-----------------+------------------+  +-----------------+-----------------+  +-----------------+----------------+  |
+--------------------|---------------------------------------|--------------------------------------|-------------------+
                     | HTTP POST /api/v1/voice/clone         | Bearer JWT (sub claim)               | WS /ws/v1/stream
                     v                                       v                                      v
+-----------------------------------------------------------------------------------------------------------------------+
|                                      BACKEND CONTROL PLANE GATEWAY (FastAPI)                                          |
|                                                                                                                       |
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  |  Dependency Injector (deps.py) -> Validates JWT, extracts User ID, acquires DB Session from pool                  |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
|                                                      |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
|  |  Service Layer (supabase_client.py / db_session)                                                                |  |
|  |  - Inserts Audio Asset record into `audio_assets` (R2 key, SHA256 content hash, duration)                         |  |
|  |  - Inserts Voice Profile record into `speaker_profiles` (256-d L2-normalized vector embedding)                    |  |
|  |  - Executes stored RPC function `match_voices` for vector cosine similarity lookup                               |  |
|  |  - Creates Synthesis Task record in `synthesis_jobs` with status='queued'                                        |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
+------------------------------------------------------|----------------------------------------------------------------+
                                                       | Async Task Enqueue
                                                       v
+-----------------------------------------------------------------------------------------------------------------------+
|                                      ASYNCHRONOUS WORKER & QUEUE PLANE (Celery + Redis)                               |
|                                                                                                                       |
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  |  Celery Task Execution Handler (tasks.py)                                                                       |  |
|  |  - Updates `synthesis_jobs` state -> status='processing', started_at=NOW()                                        |  |
|  |  - Invokes HF Spaces Inference Microservice                                                                      |  |
|  |  - Streams 16-bit PCM chunks to Redis Pub/Sub                                                                     |  |
|  |  - Updates `synthesis_jobs` state -> status='streaming', ttfb_ms=elapsed_ms                                       |  |
|  |  - Uploads final WAV artifact to Cloudflare R2 & inserts `audio_assets` record                                    |  |
|  |  - Updates `synthesis_jobs` state -> status='completed', real_time_factor=rtf, output_audio_id=asset_id          |  |
|  |  - Writes billing log entry into `usage_logs` (characters_count, audio_duration_seconds, compute_ms)              |  |
|  +-----------------------------------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------------------------------+
                                                       |
                                                       v
+-----------------------------------------------------------------------------------------------------------------------+
|                                      PERSISTENCE & TELEMETRY LAYER (Supabase Postgres)                                |
|                                                                                                                       |
|  +----------------------------------+  +-----------------------------------+  +------------------------------------+  |
|  | PostgreSQL 15+ Database          |  | Supabase pgvector HNSW Index      |  | Supabase Row-Level Security (RLS)  |  |
|  | - `users`                        |  | - `idx_speaker_profiles_embedding`|  | - Mapped to `auth.uid()` JWT claims|  |
|  | - `speaker_profiles`             |  |   USING hnsw (vector_cosine_ops)  |  | - Tenant boundary enforcement       |  |
|  | - `audio_assets`                 |  | - Stored RPC `match_voices`       |  | - Public preset read access        |  |
|  | - `synthesis_jobs`               |  +-----------------------------------+  +------------------------------------+  |
|  | - `api_keys`                     |                                                                                 |
|  | - `usage_logs`                   |                                                                                 |
|  | - `telemetry_metrics`            |                                                                                 |
|  +----------------------------------+                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## Section B: Dependency & Framework Specification Matrix

| Dependency | Target Package | Module Target | Role in Database Alignment |
| :--- | :--- | :--- | :--- |
| **SQLAlchemy** | `sqlalchemy>=2.0.28` | `backend/app/db/base.py` | ORM declarative mapping, table models, foreign key relationships, auto-migrations. |
| **pgvector** | `pgvector>=0.2.5` | `backend/app/db/base.py` | Native SQLAlchemy vector type binding for 256-dimensional speaker embeddings. |
| **Psycopg2-Binary** | `psycopg2-binary>=2.9.9` | `backend/app/db/session.py` | Production PostgreSQL database driver providing thread-safe connection pooling. |
| **Pydantic V2** | `pydantic>=2.6.4` | `backend/app/schemas/` | Strict Data Transfer Object (DTO) schemas for request/response serialization. |
| **Supabase-Py** | `supabase>=2.3.4` | `backend/app/services/supabase_client.py` | Client library for executing PostgREST queries, RLS auth headers, and `match_voices` RPC calls. |
| **Pytest** | `pytest>=8.0.0` | `backend/tests/` | Unit and integration testing harness verifying DB models, vector math, and API flows. |

---

## Section C: File Creation & Modification Inventory

The inventory below details every workspace file to be created, modified, or verified under Phase 1 Database Alignment:

### 1. Database Specifications & SQL Migrations (`/docs/architecture/`, `/infra/supabase/migrations/`)
* `docs/architecture/DATABASE_DESIGN.md`: Master Database Architecture Specification (Created).
* `infra/supabase/migrations/00001_create_embeddings.sql`: Baseline DDL schema, ENUMs, core tables, legacy `voices` view (Updated).
* `infra/supabase/migrations/00002_rls_security.sql`: Declarative Row-Level Security policies across all operational tables (Updated).
* `infra/supabase/migrations/00003_pgvector_hnsw_indexes.sql`: HNSW vector index, composite indexes, timestamp triggers, `match_voices` RPC (Created).

### 2. Backend Database Core Layer (`/backend/app/db/`)
* `backend/app/db/base.py`: Declarative SQLAlchemy ORM models (`User`, `SpeakerProfile`, `AudioAsset`, `SynthesisJob`, `ApiKey`, `UsageLog`, `TelemetryMetric`) (Updated).
* `backend/app/db/session.py`: Connection pool manager (`SessionLocal`), engine settings, and FastAPI dependency (`get_db`) (Updated).

### 3. Backend Pydantic Schemas & DTO Layer (`/backend/app/schemas/`)
* `backend/app/schemas/voice.py`: Schemas for `SpeakerProfileCreate`, `SpeakerProfileResponse`, `VoiceCloneRequest`, `VoiceCloneResponse`, `TTSGenerateRequest`, `TTSGenerateResponse` (To be updated).
* `backend/app/schemas/audio.py`: Schemas for `AudioAssetCreate`, `AudioUploadResponse` (To be updated).
* `backend/app/schemas/telemetry.py`: Schemas for `SynthesisJobUpdate`, `UsageLogCreate`, `TelemetryMetricCreate` (To be updated).

### 4. Backend Service & Endpoint Layer (`/backend/app/services/`, `/backend/app/api/v1/endpoints/`)
* `backend/app/services/supabase_client.py`: High-level vector search, voice profile insertion, and RPC wrapper with fallback handling (Updated).
* `backend/app/services/task_dispatcher.py`: Job lifecycle persistence (`synthesis_jobs` state updates) during Celery queuing (To be updated).
* `backend/app/api/v1/endpoints/clone.py`: API handler recording uploaded reference audio in `audio_assets` and saving profile into `speaker_profiles` (To be updated).
* `backend/app/api/v1/endpoints/tts.py`: API handler validating target speaker profile and inserting `synthesis_jobs` record (To be updated).
* `backend/app/api/v1/endpoints/stream.py`: WebSocket handler updating job TTFB and completion state (To be updated).

### 5. Automation & Integration Test Harness (`/scripts/`, `/backend/tests/`)
* `scripts/seed_database.py`: Populates database tables with realistic test vectors, profiles, and audio assets (Updated).
* `backend/tests/test_db_models.py`: Pytest suite verifying SQLAlchemy ORM relationships, constraints, and cascade deletes (To be created).
* `backend/tests/test_vector_search.py`: Pytest suite verifying `match_voices` RPC cosine similarity search and threshold filtering (To be created).

---

## Section D: Step-by-Step Task Execution Blueprint

---

### Milestone 1: ORM Models & DB Connection Pooling Alignment
Align backend ORM models and database session management with `DATABASE_DESIGN.md`.

- [x] **Task 1.1**: Populate `infra/supabase/migrations/00001_create_embeddings.sql` with full production DDL (`users`, `speaker_profiles`, `audio_assets`, `synthesis_jobs`, `api_keys`, `usage_logs`, `telemetry_metrics`, and view `voices`).
- [x] **Task 1.2**: Update `infra/supabase/migrations/00002_rls_security.sql` applying airtight Row-Level Security (RLS) policies for tenant isolation.
- [x] **Task 1.3**: Construct `infra/supabase/migrations/00003_pgvector_hnsw_indexes.sql` creating HNSW vector index (`vector_cosine_ops`), composite B-tree indexes, timestamp triggers, and stored function `match_voices`.
- [x] **Task 1.4**: Update `backend/app/db/base.py` declaring SQLAlchemy ORM models (`User`, `SpeakerProfile`, `AudioAsset`, `SynthesisJob`, `ApiKey`, `UsageLog`, `TelemetryMetric`) with exact column types, foreign keys (`ON DELETE CASCADE` / `ON DELETE SET NULL`), and relationship back-references.
- [x] **Task 1.5**: Update `backend/app/db/session.py` configuring SQLAlchemy connection engine with `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`, and FastAPI session generator `get_db()`.

#### Milestone 1 Verification Gateway
* Execute `python -c "from app.db.base import Base; print(len(Base.metadata.tables))"` in backend virtualenv verifying all 7 tables are recognized by SQLAlchemy.

---

### Milestone 2: Pydantic V2 Schemas & Data Transfer Objects (DTO) Refactoring
Refactor Pydantic V2 models to mirror database tables and support API validation.

- [x] **Task 2.1**: Refactor `backend/app/schemas/voice.py` adding Pydantic V2 models:
  - `SpeakerProfileBase`, `SpeakerProfileCreate`, `SpeakerProfileUpdate`, `SpeakerProfileResponse` (including `id`, `speaker_name`, `gender`, `language_code`, `visibility`, `reference_audio_url`, `created_at`).
  - `VoiceCloneRequest`, `VoiceCloneResponse`, `TTSGenerateRequest`, `TTSGenerateResponse`.
- [x] **Task 2.2**: Refactor `backend/app/schemas/audio.py` adding Pydantic V2 models:
  - `AudioAssetCreate`, `AudioAssetResponse` (including `id`, `r2_object_key`, `content_hash`, `duration_seconds`, `sample_rate`, `file_size_bytes`).
- [x] **Task 2.3**: Refactor `backend/app/schemas/telemetry.py` adding Pydantic V2 models:
  - `SynthesisJobCreate`, `SynthesisJobUpdate`, `SynthesisJobResponse` (including `task_id`, `status`, `real_time_factor`, `ttfb_ms`, `execution_engine`).
  - `UsageLogCreate`, `UsageLogResponse`, `TelemetryMetricCreate`.

#### Milestone 2 Verification Gateway
* Execute `pytest backend/tests/` ensuring all Pydantic model serialization tests pass cleanly with zero validation errors.

---

### Milestone 3: Supabase Service Layer & Vector RPC Integration
Refactor the database service layer for 256-d vector searches and profile persistence.

- [x] **Task 3.1**: Update `backend/app/services/supabase_client.py` integrating the `match_voices` stored RPC function with configurable similarity threshold (default `0.70`) and limit parameters.
- [x] **Task 3.2**: Add `insert_voice_vector` method in `supabase_client.py` writing into `speaker_profiles` with metadata, fallback to `voices` view, and mock execution mode when offline.
- [x] **Task 3.3**: Add CRUD repository methods in `supabase_client.py` for managing `synthesis_jobs`, `audio_assets`, and `usage_logs`.

#### Milestone 3 Verification Gateway
* Run `PYTHONPATH=backend:ml_services:. ./backend/venv/bin/python scripts/seed_database.py` verifying mock vector insertion and `match_voices` RPC query execution.

---

### Milestone 4: Celery Task Lifecycle & Persistence Orchestration
Integrate database job state tracking throughout the async synthesis execution pipeline.

- [x] **Task 4.1**: Refactor `backend/app/services/task_dispatcher.py` to insert a record into `synthesis_jobs` with status `'queued'` upon task dispatch.
- [x] **Task 4.2**: Refactor `backend/app/celery_app/tasks.py` updating job status transitions:
  - Mark status `'processing'` and `started_at = NOW()` when worker picks up job.
  - Mark status `'streaming'` and store `ttfb_ms` when first PCM chunk is emitted.
  - Insert generated WAV metadata into `audio_assets` and mark job status `'completed'`, `completed_at = NOW()`, `real_time_factor = rtf`, `output_audio_id = asset.id`.
  - On failure, mark status `'failed'` and store traceback in `error_detail` JSONB column.
- [x] **Task 4.3**: Add automatic billing log insertion into `usage_logs` capturing `characters_count`, `audio_duration_seconds`, and `compute_ms`.

#### Milestone 4 Verification Gateway
* Run Celery worker integration test verifying job status transitions in `synthesis_jobs` table from `queued` -> `processing` -> `completed`.

---

### Milestone 5: API Gateway Endpoint Database Integration
Connect API REST and WebSocket handlers to persistent database models.

- [x] **Task 5.1**: Refactor `POST /api/v1/voice/clone` in `backend/app/api/v1/endpoints/clone.py`:
  - Create `audio_assets` record for uploaded reference WAV file (computing SHA256 hash, duration, sample rate).
  - Extract 256-d speaker embedding $d$-vector.
  - Create `speaker_profiles` record linked to user ID and reference audio asset.
- [x] **Task 5.2**: Refactor `POST /api/v1/tts/generate` in `backend/app/api/v1/endpoints/tts.py`:
  - Validate speaker profile existence in `speaker_profiles`.
  - Insert job record in `synthesis_jobs`.
  - Enqueue Celery task and return task response DTO.
- [x] **Task 5.3**: Refactor WebSocket endpoint `/ws/v1/stream/{task_id}` in `backend/app/api/v1/endpoints/stream.py`:
  - Validate task status against `synthesis_jobs` table.
  - Stream PCM binary frames over WebSocket connection.

#### Milestone 5 Verification Gateway
* Execute `pytest backend/tests/test_clone_api.py` and `pytest backend/tests/test_websocket.py` asserting HTTP 202 response and database record creation.

---

### Milestone 6: Automated Database & Vector Unit/Integration Test Harness
Build comprehensive automated Pytest test suite for database operations.

- [x] **Task 6.1**: Implement `backend/tests/test_db_models.py` verifying SQLAlchemy ORM table creation, foreign key constraints (`ON DELETE CASCADE`), `CHECK` constraints, and timestamp trigger execution.
- [x] **Task 6.2**: Implement `backend/tests/test_vector_search.py` testing `match_voices` RPC cosine similarity calculation, score sorting, threshold filtering, and mock fallback.
- [x] **Task 6.3**: Implement E2E integration test verifying complete workflow from reference WAV upload -> DB profile creation -> vector search -> job execution persistence -> billing log write.

#### Milestone 6 Verification Gateway
* Execute full test suite `PYTHONPATH=backend:ml_services:. ./backend/venv/bin/pytest backend/tests/ ml_services/tests/` achieving **100% pass rate** across all unit and integration tests.

---

## Section E: Verification & Validation Gateways

Before marking Phase 1 Database Alignment as completed, all implementation changes MUST satisfy the following quantitative thresholds:

1. **ORM & Migration Integrity Gateway:**
   - 100% of tables defined in `DATABASE_DESIGN.md` (`users`, `speaker_profiles`, `audio_assets`, `synthesis_jobs`, `api_keys`, `usage_logs`, `telemetry_metrics`) must be active in migration DDL scripts and recognized by SQLAlchemy ORM metadata.
2. **Vector Query Performance Gateway:**
   - Vector similarity search via `match_voices` must execute in $< 15\text{ ms}$ for $N=1,000$ mock embeddings using the HNSW cosine index.
3. **Data Integrity & Cascade Gateway:**
   - Deleting a parent `User` record must automatically cascade delete associated `speaker_profiles` and `api_keys` without throwing orphan key constraint errors.
   - Deleting a `SpeakerProfile` must set `speaker_profile_id` in `synthesis_jobs` to `NULL` (`ON DELETE SET NULL`).
4. **Automated Test Coverage Gateway:**
   - Entire Pytest test suite (`backend/tests/`, `ml_services/tests/`) must execute cleanly with zero errors and **100% pass rate**.

---

## Section F: Dynamic State Maintenance Protocol

1. **Task Completion Tracking:** Mark completed task items from `- [ ]` to `- [x]` in this plan immediately upon passing their corresponding Verification Gateway.
2. **Execution Logging:** Record progress milestones in the **Execution Audit History Log** below with ISO-8601 timestamps and metric summaries.
3. **Commit Cross-Referencing:** Include exact Git commit hashes for every completed milestone.

---

## Section G: Execution Audit History Log

| Timestamp (ISO-8601) | Milestone / Subtask ID | Execution Status | Metric / Verification Summary | Logged By | Git Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-08-13T20:25:00+05:30` | `Milestone 1` | **COMPLETED** | Created `DATABASE_DESIGN.md`, populated DDL migrations 00001, 00002, 00003, updated ORM `base.py`, `session.py`, `supabase_client.py`. Passed 26/26 Pytests. | Senior Architect | `802174a` |
| `2026-08-13T20:56:00+05:30` | `Plan Authoring` | **COMPLETED** | Authored comprehensive `DATABASE_ALIGNMENT_PHASE_1_PLAN.md` blueprint. | Senior Architect | Pending |
| `2026-08-13T22:30:00+05:30` | `Milestone 2 & 3` | **COMPLETED** | Refactored Pydantic schemas in voice.py, audio.py, telemetry.py. Added Supabase CRUD methods. All tests passed and DB seed script verified. | Senior Architect | `88dcec5` |
| `2026-08-13T23:07:00+05:30` | `Milestone 4` | **COMPLETED** | Integrated Celery task lifecycle states into DB (queued, processing, streaming, completed, failed) via Supabase RPC, created test_celery_integration.py verification. | Senior Architect | `71bb1ea` |
| `2026-08-13T23:28:00+05:30` | `Milestone 5` | **COMPLETED** | Connected REST and WS API handlers (clone.py, tts.py, stream.py) to persistent DB models via Supabase client, mapped schemas | Senior Architect | `f9abec5` |
| `2026-08-13T23:53:00+05:30` | `Milestone 6` | **COMPLETED** | Implemented test_db_models.py, test_vector_search.py, test_e2e_integration.py. Reached 100% pass rate over 34 tests | Senior Architect | `d197353` |

---

## Validation Checklist for DATABASE_ALIGNMENT_PHASE_1_PLAN.md

* [x] **Schema Alignment:** 100% aligned with `docs/architecture/DATABASE_DESIGN.md`.
* [x] **Granular Tasking:** Organized into 6 clear milestones with interactive Markdown checkboxes (`- [ ]`).
* [x] **Explicit Gateways:** Quantitative verification thresholds provided for vector search latency ($<15\text{ms}$), ORM table discovery, cascade deletes, and Pytest execution.
* [x] **Audit Log:** Includes ISO-8601 execution audit log table.
