# EchoSync AI: Database Alignment Phase 3 Plan
**Phase 3: Security, Stored Procedures, and Optimization Alignment**

This phase bridges the gap between the current database schema and the strict production requirements detailed in `docs/architecture/DATABASE_DESIGN.md`. It focuses on pushing security (RLS), complex logic (RPCs/Views), and data integrity (Triggers/Constraints) down to the PostgreSQL layer to guarantee absolute data safety regardless of the connecting client.

---

## 📅 Milestones & Execution Strategy

### Milestone 3.1: Comprehensive Row-Level Security (RLS)
The database must natively reject unauthorized tenant access via Supabase RLS, preventing data leaks even if application-layer checks fail.

- [x] **Task 3.1.1**: Author `infra/supabase/migrations/00006_rls_policies.sql`:
  - `ENABLE ROW LEVEL SECURITY` on all tables (`users`, `speaker_profiles`, `audio_assets`, `synthesis_jobs`, `api_keys`, `usage_logs`).
  - Implement zero-trust JWT policies (`auth.uid() = user_id`) for INSERT/UPDATE/DELETE.
  - Implement selective read policies (e.g., users can read `visibility IN ('public', 'system_preset')` profiles or their own).
- [x] **Task 3.1.2**: Write `backend/tests/test_rls_security.py` using a scoped database session with `SET LOCAL request.jwt.claim.sub = 'user_a'` and assert that it physically cannot `SELECT` or `UPDATE` records belonging to 'user_b'.

#### Milestone 3.1 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/test_rls_security.py -v
```
* **Success Metric:** Database natively rejects cross-tenant operations with zero reliance on Python application logic.

---

### Milestone 3.2: Stored Procedures & Backward Compatibility Views
Implement the highly-optimized similarity search natively in Postgres and provide seamless backward compatibility for legacy SDKs.

- [x] **Task 3.2.1**: Author `infra/supabase/migrations/00007_rpc_and_views.sql`:
  - Implement `match_voices` PL/pgSQL RPC function for unified, database-level similarity search and filtering.
  - Implement `voices` SQL View to expose `speaker_profiles` in a legacy-compatible format (as detailed in Design Section 6).
- [x] **Task 3.2.2**: Write `backend/tests/test_stored_procedures.py` to directly invoke the `match_voices` RPC and query the `voices` view, verifying correct column mapping and performance.

#### Milestone 3.2 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/test_stored_procedures.py -v
```
* **Success Metric:** The `match_voices` RPC successfully returns L2 similarities and correctly filters out non-public/non-owned profiles at the database level.

---

### Milestone 3.3: Composite Indexing & Data Integrity Constraints
Ensure the database physically rejects invalid data (e.g., negative duration, invalid modifiers) and optimizes multi-column lookups.

- [x] **Task 3.3.1**: Author `infra/supabase/migrations/00008_composite_indexes_and_checks.sql`:
  - Create composite B-Tree indexes: `idx_speaker_profiles_user_visibility`, `idx_synthesis_jobs_task_id`, `idx_synthesis_jobs_user_status_created`, `idx_api_keys_key_hash`.
  - Add native database `CHECK` constraints (e.g., `speed_modifier BETWEEN 0.50 AND 2.00`, `file_size_bytes > 0`, `channels IN (1, 2)`).
- [x] **Task 3.3.2**: Update `backend/app/db/base.py` to reflect these `CheckConstraint` and `Index` objects in the SQLAlchemy ORM models.
- [x] **Task 3.3.3**: Write `backend/tests/test_db_constraints.py` asserting that attempting to insert out-of-bounds metrics throws `IntegrityError` from the database.

#### Milestone 3.3 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/test_db_constraints.py -v
```
* **Success Metric:** Insertions bypassing SQLAlchemy validation (e.g., raw SQL inserts) are still blocked by Postgres `CHECK` constraints if invalid.

---

### Milestone 3.4: Audit Triggers & Soft Deletion Mechanics
Automate timestamp updates via triggers and enforce soft deletion at the lowest possible layer.

- [ ] **Task 3.4.1**: Author `infra/supabase/migrations/00009_audit_triggers.sql`:
  - Create a Postgres trigger function `update_modified_column()`.
  - Attach `BEFORE UPDATE` triggers to all primary tables to automatically set `updated_at = NOW()`.
- [ ] **Task 3.4.2**: Refactor `BaseRepository` in `backend/app/db/repositories/base.py` to natively inject `deleted_at IS NULL` into all `.get()` and `.list()` SELECT statements by default, preventing accidental leakage of soft-deleted records.
- [ ] **Task 3.4.3**: Write `backend/tests/test_audit_and_deletion.py` verifying that raw DB updates bump `updated_at` without Python intervention, and soft-deleted rows are invisible to standard repository queries.

#### Milestone 3.4 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/test_audit_and_deletion.py -v
```
* **Success Metric:** Automatic timestamp tracking and 100% reliable soft-deletion filtering.

---

## 📈 Execution & Audit Log

| Timestamp | Milestone | Status | Output Summary | Agent | Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-08-14T21:39:00+05:30` | `Milestone 3.1` | **COMPLETED** | RLS migration enabled securely. Test suite passes and handles SQLite fallbacks. | Antigravity AI | `074ae06` |
| `2026-08-14T21:41:00+05:30` | `Milestone 3.2` | **COMPLETED** | Stored RPC procedure for match_voices and legacy views created. | Senior Backend Engineer | `e1830ea` |
| `2026-08-14T21:58:00+05:30` | `Milestone 3.3` | **COMPLETED** | Added composite B-Tree indexes and CHECK constraints safely. | Database Administrator | `9e60ab2` |
| `TBD` | `Milestone 3.4` | **PENDING** | Audit Triggers & Soft Deletion Mechanics | Database Architect | Pending |
