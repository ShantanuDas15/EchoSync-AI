# EchoSync AI: Database Architecture Alignment & Enterprise Resilience Plan (Phase 2)

---

## Executive Overview

**EchoSync AI** is an enterprise-grade, decoupled zero-shot neural voice cloning and text-to-speech (TTS) platform. Following the initial schema baseline defined in the **Enterprise Database Architecture & Schema Specification** ([`DATABASE_DESIGN.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/docs/architecture/DATABASE_DESIGN.md)) and the foundational ORM integration in [`DATABASE_ALIGNMENT_PHASE_1_PLAN.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/docs/plans/DATABASE_ALIGNMENT_PHASE_1_PLAN.md), this **Phase 2 Database Alignment & Enterprise Resilience Plan** defines the production-grade engineering roadmap.

The goal of Phase 2 is to harden, scale, and insulate the database and workspace infrastructure against real-world production failure modes under heavy concurrent traffic. This plan introduces bidirectional schema migration tooling (Alembic + Supabase CLI), an isolated Repository & Unit-of-Work design pattern, PostgreSQL declarative table partitioning for analytical telemetry, distributed idempotency controls, connection pool circuit breaking, two-tier Redis vector caching, and dynamic HMAC-SHA256 API key authentication.

---

## Section A: High-Concurrency Data Persistence Topology

```
+---------------------------------------------------------------------------------------------------------------------------------------+
|                                              CLIENT INTERACTION & EDGE GATEWAY LAYER                                                   |
|                                                                                                                                       |
|  +-------------------------------------+  +------------------------------------+  +------------------------------------------------+  |
|  |     Next.js 14 Dashboard / Studio   |  |    Public API SDK Clients / Curl   |  |         WebSocket Audio Streamers              |  |
|  |     Clerk / NextAuth JWT Bearer     |  |    HMAC-SHA256 API Keys Header     |  |         Task ID Subscription Channel           |  |
|  +------------------+------------------+  +-----------------+------------------+  +-----------------------+------------------------+  |
+---------------------|---------------------------------------|---------------------------------------------|---------------------------+
                      | HTTPS (Idempotency-Key Header)        | HTTPS (X-API-Key Header)                    | WSS (Binary PCM Chunks)
                      v                                       v                                             v
+---------------------------------------------------------------------------------------------------------------------------------------+
|                                            BACKEND CONTROL PLANE GATEWAY (FastAPI)                                                    |
|                                                                                                                                       |
|  +---------------------------------------------------------------------------------------------------------------------------------+  |
|  | Middleware & Dependency Layer:                                                                                                  |  |
|  |  - IdempotencyMiddleware (Redis Distributed Lock & Request Key Deduplication)                                                   |  |
|  |  - ApiKeyAuthService (Constant-Time HMAC-SHA256 Hash Validation & Token Bucket Rate Limiter)                                    |  |
|  |  - SecurityContext (Extracts sub / tenant_id and sets session-level RLS context)                                                |  |
|  +---------------------------------------------------+-----------------------------------------------------------------------------+  |
|                                                      |
|  +---------------------------------------------------+-----------------------------------------------------------------------------+  |
|  | Clean Architecture Service & Repository Layer:                                                                                  |  |
|  |  - UnitOfWork (Atomic Multi-Entity Transactions with Context-Managed Rollback)                                                  |  |
|  |  - UserRepository | SpeakerProfileRepository | AudioAssetRepository | SynthesisJobRepository | ApiKeyRepository                |  |
|  |  - VectorCacheService (Two-Tier Upstash Redis Embedding Cache + pgvector HNSW Query Accelerator)                                |  |
|  |  - DatabaseCircuitBreaker (Connection Drop Recovery, Pool Saturation Protection, Exponential Backoff)                           |  |
|  +---------------------------------------------------+-----------------------------------------------------------------------------+  |
+------------------------------------------------------|--------------------------------------------------------------------------------+
                                                       | Async Dispatch & State Transitions
                                                       v
+---------------------------------------------------------------------------------------------------------------------------------------+
|                                           ASYNCHRONOUS WORKER & QUEUE PLANE (Celery + Redis)                                          |
|                                                                                                                                       |
|  +---------------------------------------------------------------------------------------------------------------------------------+  |
|  |  Celery Task Execution Handler (tasks.py)                                                                                       |  |
|  |  - Optimistic State Machine Locking on `synthesis_jobs` (queued -> processing -> streaming -> completed / failed)              |  |
|  |  - Dead Letter Queue (DLQ) & Error Stack Sanitization into `synthesis_jobs.error_detail`                                           |  |
|  |  - Async WAV Artifact Upload to Cloudflare R2 -> Persists `audio_assets` metadata via UnitOfWork                                |  |
|  |  - Emits Usage Logs & APM Metrics to Partitioned Ingestion Tables (`usage_logs`, `telemetry_metrics`)                            |  |
|  +---------------------------------------------------------------------------------------------------------------------------------+  |
+------------------------------------------------------|--------------------------------------------------------------------------------+
                                                       |
                                                       v
+---------------------------------------------------------------------------------------------------------------------------------------+
|                                            DATA PERSISTENCE & TELEMETRY LAYER (PostgreSQL 15+)                                         |
|                                                                                                                                       |
|  +------------------------------------------------+  +------------------------------------------------+  +-------------------------+  |
|  | Core Operational Entities (ACID Normalized)    |  | Vector Search Engine (pgvector)                |  | Partitioned Log Engine  |  |
|  | - `users` (Tenants, Quotas, Subscriptions)     |  | - `speaker_profiles` (256-d d-vector)          |  | - `usage_logs`          |  |
|  | - `speaker_profiles` (Voice Metadata)          |  | - HNSW Cosine Index (`vector_cosine_ops`)      |  |   (Monthly Range Part.) |  |
|  | - `audio_assets` (R2 Keys, SHA256 Deduplication)|  | - Stored Procedure `match_voices`              |  | - `telemetry_metrics`   |  |
|  | - `synthesis_jobs` (Optimistic State Machine)  |  | - Dynamic `hnsw.ef_search` Tuning              |  |   (Monthly Range Part.) |  |
|  | - `api_keys` (Hashed Credentials, Scopes)      |  +------------------------------------------------+  +-------------------------+  |
|  +------------------------------------------------+  +------------------------------------------------+                               |
|  | Row-Level Security (RLS) & Multi-Tenant Context: `auth.uid()` / `SET LOCAL request.jwt.claim.sub`                                   |  |
|  +---------------------------------------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------------------------------------+
```

---

## Section B: Dependency & Technology Specification Matrix

| Dependency | Target Package | Module Target | Role in Phase 2 Architecture |
| :--- | :--- | :--- | :--- |
| **Alembic** | `alembic>=1.13.1` | `backend/alembic/` | Production-grade bidirectional schema migration engine with revision tracking and autogen support. |
| **SQLAlchemy** | `sqlalchemy[asyncio]>=2.0.28` | `backend/app/db/` | Declarative 2.0 ORM models, async session pooling, connection lifecycle hooks, and Unit of Work. |
| **Asyncpg / Psycopg3**| `asyncpg>=0.29.0`, `psycopg[binary]>=3.1.18` | `backend/app/db/session.py` | High-performance asynchronous and pooled PostgreSQL database drivers. |
| **pgvector** | `pgvector>=0.2.5` | `backend/app/db/base.py` | Native SQLAlchemy vector type binding for 256-dimensional $d$-vector speaker embeddings. |
| **Tenacity** | `tenacity>=8.2.3` | `backend/app/core/retry.py` | Robust retry engine with exponential backoff and jitter for transient database connections. |
| **Upstash Redis** | `redis[asyncio]>=5.0.3` | `backend/app/services/vector_cache.py` | Distributed locks for idempotency, embedding vector cache, and rate limit token buckets. |
| **Pydantic V2** | `pydantic>=2.6.4` | `backend/app/schemas/` | Strict Data Transfer Objects (DTO) with $L_2$-norm validation and typed JSONB metadata schemas. |
| **Pytest & Pytest-Asyncio**| `pytest>=8.0.0`, `pytest-asyncio>=0.23.5` | `backend/tests/` | Unit, integration, transaction rollback, and migration downgrade test suites. |

---

## Section C: File Creation & Modification Inventory

The table below outlines every workspace file to be created, modified, or verified under Phase 2 Database Alignment:

### 1. Database Migrations & Evolution Framework (`/backend/alembic/`, `/infra/supabase/migrations/`)
* `backend/alembic.ini`: Alembic configuration file specifying database connection strings and logging templates (To be created).
* `backend/alembic/env.py`: Migration environment runner integrating SQLAlchemy metadata, `pgvector` dialect, and offline/online migration modes (To be created).
* `backend/alembic/script.py.mako`: Template for forward (`upgrade`) and backward (`downgrade`) migration scripts (To be created).
* `backend/alembic/versions/0001_initial_schema.py`: Baseline versioned migration reflecting `DATABASE_DESIGN.md` (To be created).
* `infra/supabase/migrations/00004_table_partitioning.sql`: PostgreSQL range partitioning for `usage_logs` and `telemetry_metrics` with monthly partition triggers (To be created).

### 2. Database Core, Session & Resilience Layer (`/backend/app/db/`, `/backend/app/core/`)
* `backend/app/db/session.py`: Resilient connection pool manager supporting connection recycling, statement timeouts, retry decorators, and health checks (To be updated).
* `backend/app/db/base.py`: Enhanced SQLAlchemy ORM models with optimistic locking version keys (`version_id`), typed JSONB metadata accessors, and check constraints (To be updated).
* `backend/app/db/unit_of_work.py`: Context-managed Unit of Work orchestrating atomic multi-repository database transactions (To be created).
* `backend/app/core/circuit_breaker.py`: Circuit breaker protection against database pool saturation and network partition events (To be created).
* `backend/app/core/retry.py`: Exponential backoff and jitter decorators for transient database connection retries (To be created).

### 3. Repository & Data Access Layer (`/backend/app/db/repositories/`)
* `backend/app/db/repositories/base.py`: Generic base repository offering type-safe CRUD operations, cursor pagination, and bulk inserts (To be created).
* `backend/app/db/repositories/user_repo.py`: User account repository managing subscriptions, quotas, and soft deletions (To be created).
* `backend/app/db/repositories/speaker_repo.py`: Speaker profile repository with HNSW vector similarity queries, $L_2$ normalization checks, and preset queries (To be created).
* `backend/app/db/repositories/audio_repo.py`: Audio asset repository with SHA256 content deduplication lookups and R2 key management (To be created).
* `backend/app/db/repositories/job_repo.py`: Synthesis job repository with atomic state machine transitions and error logging (To be created).
* `backend/app/db/repositories/api_key_repo.py`: API key repository with HMAC-SHA256 constant-time hash matching and scope validation (To be created).
* `backend/app/db/repositories/usage_repo.py`: High-throughput usage and telemetry log repository with bulk batching (To be created).

### 4. Schemas, Middleware & Security Services (`/backend/app/schemas/`, `/backend/app/services/`, `/backend/app/api/v1/`)
* `backend/app/schemas/user.py`: Pydantic V2 schemas for `UserCreate`, `UserUpdate`, `UserResponse`, and `SubscriptionTier` (To be created).
* `backend/app/schemas/api_key.py`: Pydantic V2 schemas for `ApiKeyCreate`, `ApiKeyResponse`, `ApiKeyValidation`, and `ScopeEnum` (To be created).
* `backend/app/services/api_key_service.py`: Service for secure key generation (`echo_live_...`), constant-time hash validation, and Redis cache lookup (To be created).
* `backend/app/services/vector_cache.py`: Two-tier Redis cache for 256-d speaker embeddings and similarity result sets (To be created).
* `backend/app/api/v1/middleware/idempotency.py`: Distributed Idempotency middleware ensuring zero duplicate task dispatching (To be created).
* `backend/app/api/v1/endpoints/health.py`: Comprehensive `/health/db` endpoint probing latency, pool status, and pgvector readiness (To be created).

### 5. Maintenance Scripts & Pytest Verification Suites (`/scripts/`, `/backend/tests/`)
* `scripts/manage_partitions.py`: CLI script creating upcoming monthly partitions and archiving historical logs to Cloudflare R2 (To be created).
* `scripts/benchmark_db_vector.py`: Stress test script measuring vector similarity search latency ($<15\text{ms}$) under concurrent load (To be created).
* `backend/tests/test_repositories.py`: Pytest suite testing repository CRUD, pagination, and multi-entity Unit of Work transactions (To be created).
* `backend/tests/test_migrations.py`: Automated Pytest verifying forward migration (`alembic upgrade`) and full rollback (`alembic downgrade`) (To be created).
* `backend/tests/test_idempotency.py`: Pytest suite validating request deduplication, distributed lock release, and error handling (To be created).
* `backend/tests/test_circuit_breaker.py`: Pytest suite testing database circuit breaker tripping and graceful recovery (To be created).

---

## Section D: Granular Milestone Blueprint & Execution Plan

---

### Milestone 2.1: Alembic Migration Framework & Zero-Downtime Evolution
Establish bidirectional, version-controlled database migrations with full support for PostgreSQL custom types and `pgvector`.

- [ ] **Task 2.1.1**: Initialize Alembic structure in `backend/alembic/` configuring `alembic.ini` and `env.py` to bind with SQLAlchemy `Base.metadata` and PostgreSQL `vector` types.
- [ ] **Task 2.1.2**: Generate baseline version script `backend/alembic/versions/0001_initial_schema.py` covering tables (`users`, `speaker_profiles`, `audio_assets`, `synthesis_jobs`, `api_keys`, `usage_logs`, `telemetry_metrics`) and compatibility view `voices`.
- [ ] **Task 2.1.3**: Implement bidirectional `upgrade()` and `downgrade()` logic in all migration scripts, guaranteeing 100% reversible rollbacks.
- [ ] **Task 2.1.4**: Add automated migration test `backend/tests/test_migrations.py` validating that migrations execute cleanly from `base -> head -> base` with zero errors.

#### Milestone 2.1 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_migrations.py -v
```
* **Boundary Checks:** Verify that rolling back the baseline migration drops all tables cleanly without leaving orphaned types or locked relations.
* **Success Metric:** Migration execution and rollback pass with exit code 0.

---

### Milestone 2.2: Decoupled Repository Pattern & Unit-of-Work Architecture
Decouple business logic and API endpoints from raw PostgREST HTTP queries by building an enterprise-grade Repository and Unit-of-Work pattern.

- [ ] **Task 2.2.1**: Implement generic `BaseRepository[T]` in `backend/app/db/repositories/base.py` providing type-safe CRUD methods (`get_by_id`, `list`, `create`, `update`, `delete`, `bulk_create`, and cursor pagination).
- [ ] **Task 2.2.2**: Implement specialized domain repositories:
  - `UserRepository` in `user_repo.py`: Manages user quotas, sub lookups, and tier entitlement validation.
  - `SpeakerProfileRepository` in `speaker_repo.py`: Manages voice profiles, $L_2$-normalized vector search, and public system presets.
  - `AudioAssetRepository` in `audio_repo.py`: Manages audio metadata and SHA256 content deduplication queries.
  - `SynthesisJobRepository` in `job_repo.py`: Manages atomic state machine transitions (`queued` -> `processing` -> `streaming` -> `completed` / `failed`).
  - `ApiKeyRepository` in `api_key_repo.py`: Manages constant-time hash lookups and scope verification.
  - `UsageLogRepository` in `usage_repo.py`: Provides high-throughput batch insertion for billing and telemetry.
- [ ] **Task 2.2.3**: Implement `UnitOfWork` in `backend/app/db/unit_of_work.py` providing transactional context management (`async with UnitOfWork() as uow:`) with automatic rollback on exception.
- [ ] **Task 2.2.4**: Implement comprehensive test suite `backend/tests/test_repositories.py` verifying repository operations and transaction rollback atomicity.

#### Milestone 2.2 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_repositories.py -v
```
* **Boundary Checks:** Assert that an unhandled exception inside a multi-entity `UnitOfWork` transaction automatically rolls back all intermediate inserts (`audio_assets`, `speaker_profiles`, `synthesis_jobs`).
* **Success Metric:** 100% test pass rate across all repository methods and rollback scenarios.

---

### Milestone 2.3: Database Connection Resilience, Pool Tuning & Circuit Breaker
Protect the persistence tier against connection exhaustion, transient network dropouts, and slow query cascades.

- [ ] **Task 2.3.1**: Upgrade `backend/app/db/session.py` configuring SQLAlchemy connection engine with:
  - `pool_size=20`, `max_overflow=40`, `pool_recycle=1800` (recycle connections older than 30 mins).
  - `pool_timeout=30`, `connect_args={"connect_timeout": 10, "options": "-c statement_timeout=15000"}`.
- [ ] **Task 2.3.2**: Implement `backend/app/core/retry.py` using Tenacity to supply `@with_db_retry` decorator with exponential backoff and jitter for transient connection errors (`OperationalError`, `InterfaceError`).
- [ ] **Task 2.3.3**: Implement `DatabaseCircuitBreaker` in `backend/app/core/circuit_breaker.py` tracking consecutive database failures (tripping after 5 failures in 30s, half-open probe after 15s).
- [ ] **Task 2.3.4**: Implement deep healthcheck endpoint `GET /api/v1/health/db` in `backend/app/api/v1/endpoints/health.py` reporting query latency (ms), active pool connections, and pgvector readiness.
- [ ] **Task 2.3.5**: Implement unit test `backend/tests/test_circuit_breaker.py` asserting circuit breaker transitions (`CLOSED` -> `OPEN` -> `HALF_OPEN` -> `CLOSED`).

#### Milestone 2.3 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_circuit_breaker.py backend/tests/test_health.py -v
```
* **Boundary Checks:** Verify that simulated database outages trigger fast-fail 503 responses without blocking the ASGI event loop or hanging worker threads.
* **Success Metric:** Healthcheck returns HTTP 200 with latency $< 20\text{ms}$ when healthy and circuit breaker isolates failures.

---

### Milestone 2.4: Analytical Table Partitioning & Data Lifecycle Management
Implement high-throughput range partitioning for `usage_logs` and `telemetry_metrics` to eliminate write amplification and index degradation as data volume grows.

- [ ] **Task 2.4.1**: Create `infra/supabase/migrations/00004_table_partitioning.sql` transforming `usage_logs` and `telemetry_metrics` into declarative range-partitioned tables partitioned by `created_at`.
- [ ] **Task 2.4.2**: Generate initial child partitions for the current and future calendar months (e.g., `usage_logs_2026_08`, `usage_logs_2026_09`, `telemetry_metrics_2026_08`, `telemetry_metrics_2026_09`) with default catch-all partitions.
- [ ] **Task 2.4.3**: Develop automated partition management script `scripts/manage_partitions.py` supporting:
  - `--create-upcoming`: Pre-creates partitions for the next 3 months.
  - `--archive-older-than <days>`: Exports historical partition data to Cloudflare R2 in compressed Parquet format and drops aged partitions.
- [ ] **Task 2.4.4**: Implement integration test in `backend/tests/test_db_models.py` verifying partition routing on record insertion across multiple dates.

#### Milestone 2.4 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. python scripts/manage_partitions.py --dry-run
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_db_models.py -k "partition" -v
```
* **Boundary Checks:** Verify that inserting log records with timestamps across month boundaries routes rows into the exact child partition table without constraint errors.
* **Success Metric:** 100% partition routing accuracy and dry-run partition creation succeeds.

---

### Milestone 2.5: Dynamic API Key Authentication, Scoped RBAC & RLS Integration
Replace static secret tokens with dynamic, database-persisted API keys featuring constant-time hash verification, permission scopes, and per-key rate limits.

- [ ] **Task 2.5.1**: Implement Pydantic V2 schemas in `backend/app/schemas/api_key.py` (`ApiKeyCreate`, `ApiKeyResponse`, `ApiKeyValidationResponse`, `ScopeEnum`).
- [ ] **Task 2.5.2**: Implement `ApiKeyAuthService` in `backend/app/services/api_key_service.py`:
  - Generates secure API keys with prefix (`echo_live_<32_random_bytes>`).
  - Hashes raw key using HMAC-SHA256 before database insertion.
  - Constant-time hash verification (`hmac.compare_digest`) with Upstash Redis in-memory lookup cache (TTL 300s).
  - Updates `last_used_at` asynchronously via background task.
- [ ] **Task 2.5.3**: Refactor `verify_api_key` dependency in `backend/app/api/v1/deps.py` to validate API key permissions (`synthesis:write`, `voices:read`, `voices:write`) and enforce `rate_limit_per_minute`.
- [ ] **Task 2.5.4**: Implement session-level Supabase RLS context injection (`SET LOCAL request.jwt.claim.sub = :user_id`) in SQLAlchemy database sessions.
- [ ] **Task 2.5.5**: Implement test suite `backend/tests/test_api_key_auth.py` verifying key generation, valid authentication, invalid token rejection, scope denial (HTTP 403), and rate limit throttling (HTTP 429).

#### Milestone 2.5 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_api_key_auth.py -v
```
* **Boundary Checks:** Test key expiration (`expires_at < NOW()`), revoked status (`status='revoked'`), and scope mismatch (`synthesis:write` key attempting `admin:delete`).
* **Success Metric:** All authentication, authorization, and rate limit test cases pass with zero vulnerabilities.

---

### Milestone 2.6: Distributed Idempotency & Concurrency State Machine
Protect synthesis execution against duplicate API submissions, double billing, and worker race conditions.

- [ ] **Task 2.6.1**: Implement `IdempotencyMiddleware` in `backend/app/api/v1/middleware/idempotency.py`:
  - Inspects `Idempotency-Key` HTTP header on POST requests.
  - Acquires Redis distributed lock with 120s TTL during request processing.
  - Caches HTTP response status code and JSON payload in Redis; returns cached response on duplicate request submission.
- [ ] **Task 2.6.2**: Add optimistic concurrency control in `backend/app/db/base.py` on `synthesis_jobs` with `version_id = Column(Integer, nullable=False, default=1)`.
- [ ] **Task 2.6.3**: Implement atomic state machine validator in `SynthesisJobRepository`:
  - Enforces valid transitions (`queued -> processing -> streaming -> completed / failed / cancelled`).
  - Rejects out-of-order transitions (e.g. `completed -> processing`).
- [ ] **Task 2.6.4**: Implement test suite `backend/tests/test_idempotency.py` verifying duplicate request suppression, cache hit return, and lock release on error.

#### Milestone 2.6 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. pytest backend/tests/test_idempotency.py -v
```
* **Boundary Checks:** Send 5 concurrent identical POST requests with the same `Idempotency-Key`. Assert that exactly 1 task is dispatched and 4 return the cached response.
* **Success Metric:** 100% duplicate suppression and zero race conditions during worker updates.

---

### Milestone 2.7: Two-Tier Vector Caching, HNSW Optimization & Load Benchmarking
Optimize pgvector search performance to consistently deliver sub-15ms vector retrieval across $1,000,000+$ speaker embeddings.

- [ ] **Task 2.7.1**: Implement `VectorCacheService` in `backend/app/services/vector_cache.py`:
  - L1/L2 Redis caching for 256-d speaker embeddings indexed by voice ID and reference audio content hash (`SHA256`).
  - Serializes float arrays to compact binary buffers (`struct.pack`) to minimize Redis memory footprint.
- [ ] **Task 2.7.2**: Optimize `match_voices` RPC query execution:
  - Dynamically inject `SET LOCAL hnsw.ef_search = 100` before query execution for optimal search recall vs latency tradeoff.
  - Implement $L_2$ norm validation in Pydantic schemas asserting $||\vec{v}||_2 = 1.0 \pm 0.001$.
- [ ] **Task 2.7.3**: Implement cursor-based pagination on `SpeakerProfileRepository.list_profiles` for scalable frontend voice browsing.
- [ ] **Task 2.7.4**: Develop performance benchmarking script `scripts/benchmark_db_vector.py`:
  - Seeds database with $N=10,000$ synthetic 256-d speaker vectors.
  - Measures 95th and 99th percentile query latency across 500 concurrent similarity queries.
- [ ] **Task 2.7.5**: Execute full end-to-end test suite ensuring **100% pass rate** across all backend and ML service tests.

#### Milestone 2.7 Verification Gateway & Test Design
```python
# Verification Command:
# PYTHONPATH=backend:ml_services:. python scripts/benchmark_db_vector.py --samples 500 --top-k 5
# PYTHONPATH=backend:ml_services:. pytest backend/tests/ ml_services/tests/ -v
```
* **Boundary Checks:** Validate that vector similarity search maintains $P_{95} \text{ latency} < 15\text{ms}$ and $P_{99} \text{ latency} < 25\text{ms}$.
* **Success Metric:** Benchmark passes latency targets and 100% of automated tests pass cleanly.

---

## Section E: Deployment Safety, Fixture Scrubbing & Zero Error Protocol

In strict adherence to project rules in [`GEMINI.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/GEMINI.md), all implementations under Phase 2 must follow these safety mandates:

1. **Deterministic Test Isolation:**
   - All automated test suites (`backend/tests/`) must use in-memory SQLite or sandboxed PostgreSQL fixtures with transactional rollback per test function.
   - Tests must never depend on live external networks, third-party APIs, or live Supabase production databases.
2. **Fixture Scrubbing:**
   - Pytest fixtures must clean up all temporary database rows, mock Redis keys, and file artifacts automatically upon fixture teardown (`yield` pattern).
   - Temporary test audio files and sqlite database files must be wiped before test process exit.
3. **Repository Cleanliness:**
   - Before any Git commit, completely scrub the workspace of stray `__pycache__`, `.pytest_cache`, `.DS_Store`, and temporary test artifacts.
   - Ensure `.gitignore` isolates all sensitive `.env` configurations.

---

## Section F: Dynamic State Maintenance Protocol

1. **Interactive Checkbox Tracking:** Mark tasks from `- [ ]` to `- [x]` immediately upon completing the implementation and passing its corresponding Verification Gateway.
2. **Execution Progress Audit:** Record progress in the **Phase 2 Execution Audit History Log** below with ISO-8601 timestamps, logged roles, and metric summaries.
3. **Commit Hash Cross-Referencing:** Append the exact Git commit hash for every completed milestone.

---

## Section G: Phase 2 Execution Audit History Log

| Timestamp (ISO-8601) | Milestone / Task ID | Execution Status | Verification & Performance Summary | Logged By | Git Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-08-14T20:45:00+05:30` | `Plan Authoring` | **COMPLETED** | Authored master `DATABASE_ALIGNMENT_PHASE_2_PLAN.md` incorporating enterprise resilience, Alembic, Repositories, Partitioning, API Key RBAC, and Idempotency. | Principal Architect | `221ae05` |
| `TBD` | `Milestone 2.1` | **PENDING** | Alembic migration framework & rollback verification | Senior Backend Engineer | Pending |
| `TBD` | `Milestone 2.2` | **PENDING** | Repository pattern & Unit of Work implementation | Senior Backend Engineer | Pending |
| `TBD` | `Milestone 2.3` | **PENDING** | Connection pool resilience & circuit breaker | Senior Backend Engineer | Pending |
| `TBD` | `Milestone 2.4` | **PENDING** | Analytical table partitioning & log archival | Senior Database Engineer | Pending |
| `TBD` | `Milestone 2.5` | **PENDING** | Dynamic API key authentication & scoped RBAC | Senior Security Engineer | Pending |
| `TBD` | `Milestone 2.6` | **PENDING** | Distributed idempotency & concurrency state machine | Senior Backend Engineer | Pending |
| `TBD` | `Milestone 2.7` | **PENDING** | Two-tier vector cache, HNSW tuning & benchmark | Senior ML/DB Engineer | Pending |

---

## Validation Checklist for DATABASE_ALIGNMENT_PHASE_2_PLAN.md

* [x] **Schema & Architecture Alignment:** 100% aligned with [`DATABASE_DESIGN.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/docs/architecture/DATABASE_DESIGN.md).
* [x] **Enterprise Resilience:** Addresses connection pooling, circuit breaking, retries, and failure recovery.
* [x] **Scalability & Schema Evolution:** Incorporates Alembic migrations, range partitioning, and two-tier Redis caching.
* [x] **Zero Error & Deployment Safety:** Adheres strictly to [`GEMINI.md`](file:///home/shantanu/Documents/DL%20Projects/EchoSync%20AI/GEMINI.md) testing, scrubbing, and isolation guidelines.
* [x] **Explicit Gateways:** Quantitative verification thresholds and boundary checks provided for all 7 milestones.
* [x] **Audit Log:** Contains ISO-8601 progress audit table with commit cross-referencing.
