# EchoSync AI - Phase 5: High-Performance Infrastructure & Resiliency

## Overview
With the core PostgreSQL 15+ schema, vector indices, transaction architectures, and connection pooling completed in Phases 1-4, Phase 5 transitions focus toward **distributed resiliency, high-throughput scaling, and production infrastructure integration**. 

To match the enterprise production-grade standard specified in the `DATABASE_DESIGN.md`, the backend must now gracefully handle caching, distributed rate limiting, binary object persistence (R2), and high-volume analytical writes without degrading the primary relational database.

---

## Development Milestones

### Milestone 5.1: Distributed Rate Limiting & Transient Caching (Redis/Upstash)
To protect the backend from abuse and optimize vector search retrieval, we must integrate a fast transient layer.
- [x] **Task 5.1.1**: Implement `RedisClient` utilizing `redis.asyncio` configured for Upstash Redis.
- [x] **Task 5.1.2**: Refactor `VerifyApiKey` dependency router (in `app/api/v1/deps.py`) to enforce distributed rate limiting (`rate_limit_per_minute`) using a Redis Token Bucket or sliding window algorithm instead of the current in-memory stub.
- [x] **Task 5.1.3**: Implement a two-tier vector caching decorator for the `match_voices` RPC call. Cache frequently matched $d$-vector results in Redis (TTL 1 hour) before falling back to the Postgres HNSW index.

#### Milestone 5.1 Verification Gateway
```bash
pytest backend/tests/test_redis_caching.py -v
```

### Milestone 5.2: Cloudflare R2 Binary Object Storage Integration
The `audio_assets` table tracks file metadata, but the physical WAV/MP3 files must be safely synchronized to Cloudflare R2.
- [ ] **Task 5.2.1**: Implement `R2StorageService` utilizing `aioboto3` to asynchronously stream generated audio and reference samples to the `echosync-audio-vault` bucket.
- [ ] **Task 5.2.2**: Integrate `R2StorageService` into the `BaseRepository` lifecycle. Ensure that when an `AudioAsset` record is soft-deleted, an asynchronous Celery task is dispatched to prune the binary payload from R2 (cost optimization).
- [ ] **Task 5.2.3**: Develop pre-signed URL generation endpoints for `reference_audio_url` streaming, ensuring secure playback directly from the edge.

#### Milestone 5.2 Verification Gateway
```bash
pytest backend/tests/test_r2_storage.py -v
```

### Milestone 5.3: Time-Series Table Partitioning for Telemetry & Billing
To prevent write amplification and massive B-Tree index degradation on the core nodes, high-velocity analytical logs must be partitioned.
- [ ] **Task 5.3.1**: Modify the SQLAlchemy models for `usage_logs` and `telemetry_metrics` to utilize PostgreSQL native declarative partitioning by `RANGE (created_at)`.
- [ ] **Task 5.3.2**: Generate Alembic migrations to physically convert the existing tables into partitioned tables (creating monthly or weekly sub-partitions dynamically).
- [ ] **Task 5.3.3**: Configure a scheduled background worker (Celery Beat or `pg_cron`) to automatically provision next month's partitions in advance.

#### Milestone 5.3 Verification Gateway
```bash
pytest backend/tests/test_db_partitioning.py -v
```

### Milestone 5.4: CI/CD Automated Database Migration Pipeline
To finalize deployment readiness, migrations must automatically run in staging and production CI environments safely.
- [ ] **Task 5.4.1**: Create a `backend/scripts/deploy_migrations.sh` pipeline script that strictly validates Alembic downgrade/upgrade paths and applies `000*.sql` Supabase artifacts to the target environment securely.
- [ ] **Task 5.4.2**: Wrap the migration execution in a transactional advisory lock (`pg_advisory_lock`) to prevent race conditions during multi-instance rolling zero-downtime deployments.

#### Milestone 5.4 Verification Gateway
```bash
pytest backend/tests/test_migration_pipeline.py -v
```

---

## Rules of Engagement (GEMINI.md strictly enforced)
1. **Zero Downtime:** Changes in Milestone 5.3 must not lock the database for extended periods. 
2. **Mocking External IO:** R2 and Redis tasks *must* be fully sandboxed using `moto` (for S3/R2 mocks) and `fakeredis` during local `pytest` verification gateways.
3. **Fixture Scrubbing:** Tests must clean up mock state immediately to prevent CI/CD pollution.

---

## Status & Audit Log
| Timestamp | Milestone | Status | Output Summary | Agent | Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-08-15T00:06:50+05:30` | `Milestone 5.1` | **COMPLETED** | Implemented Upstash Redis caching layer. Refactored VerifyApiKey for distributed token-bucket API rate limits. Added `cache_vector_search` decorator for L1/L2 Vector caching on `match_voices` RPC. Verification tests passed gracefully with `fakeredis`. | Backend Engineer | `5d1e215` |
| `TBD` | `Milestone 5.2` | **PENDING** | Cloudflare R2 Binary Object Storage Integration | Backend Engineer | Pending |
| `TBD` | `Milestone 5.3` | **PENDING** | Time-Series Table Partitioning | DBA | Pending |
| `TBD` | `Milestone 5.4` | **PENDING** | CI/CD Database Migration Pipeline | DevOps Architect | Pending |
