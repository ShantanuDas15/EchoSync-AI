# EchoSync AI: Database Alignment Phase 4 Plan
**Phase 4: Database Automation, Testing Infrastructure & DevOps (DbOps)**

With the database schema, security (RLS), stored procedures, and triggers fully aligned with the architectural specifications in `docs/architecture/DATABASE_DESIGN.md`, this final database phase shifts focus toward **Production Reliability and Developer Velocity**. 

To ensure the database can be upgraded and altered based on necessity with ease and convenience, we must eliminate the "split-brain" migration issue (Alembic vs Supabase SQL), upgrade our testing environment from SQLite to true containerized PostgreSQL, and establish industry-standard CI/CD guardrails.

---

## 📅 Milestones & Execution Strategy

### Milestone 4.1: Unified Migration Pipeline (Alembic ↔ Supabase Sync)
Currently, developers edit SQLAlchemy models (`app/db/base.py`) but must manually write SQL in `infra/supabase/migrations/`. We will unify this so altering the database is frictionless.

- [x] **Task 4.1.1**: Author a custom migration utility `backend/scripts/generate_migration.py` that utilizes Alembic's `autogenerate` feature to detect changes in SQLAlchemy models.
- [x] **Task 4.1.2**: Instead of dumping to Python files in `alembic/versions`, intercept the Alembic AST stream and compile it directly into raw, deterministic PostgreSQL `.sql` scripts inside `infra/supabase/migrations/`.
- [x] **Task 4.1.3**: Validate the script by making a temporary change to a model, generating the SQL, and ensuring the SQL correctly reflects the DDL alter statement.

#### Milestone 4.1 Verification Gateway
```python
# Verification Command:
# ./venv/bin/python backend/scripts/generate_migration.py --message "test sync"
```
* **Success Metric:** Changes to Python ORM models reliably compile down to native PostgreSQL `.sql` files automatically, removing the risk of human error during schema alterations.

---

### Milestone 4.2: Containerized Integration Testing (Testcontainers)
SQLite memory databases are brittle and ignore PostgreSQL-specific features like pgvector, RLS, and Triggers. We must upgrade our test pipeline to guarantee zero errors in production.

- [x] **Task 4.2.1**: Integrate `testcontainers[postgres]` into the Python test suite dependencies.
- [x] **Task 4.2.2**: Refactor `backend/tests/conftest.py` to dynamically spin up a lightweight, ephemeral PostgreSQL Docker container (with the `pgvector` extension) during test initialization.
- [x] **Task 4.2.3**: Automatically apply all `infra/supabase/migrations/*.sql` to the ephemeral container before yielding the DB session to the test functions.
- [x] **Task 4.2.4**: Remove all `@pytest.mark.skipif` workarounds from `test_rls_security.py`, `test_stored_procedures.py`, and `test_audit_and_deletion.py` and prove they pass natively.

#### Milestone 4.2 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/ -v
```
* **Success Metric:** 100% of tests pass against a real, ephemeral PostgreSQL instance mimicking the production environment identically.

---

### Milestone 4.3: Connection Pooling & Read-Replica Routing
To prevent database bottlenecks under heavy vector search loads, we must architect the SQLAlchemy engine for high-concurrency scaling.

- [ ] **Task 4.3.1**: Refactor `backend/app/db/session.py` to utilize `QueuePool` with aggressive `pool_size`, `max_overflow`, and `pool_pre_ping=True` configurations, optimizing it for external connection poolers like PgBouncer.
- [ ] **Task 4.3.2**: Implement a `get_read_session` dependency router in FastAPI that targets a read-replica database URL if configured, offloading heavy `match_voices` vector searches from the primary writer node.

#### Milestone 4.3 Verification Gateway
```python
# Verification Command:
# pytest backend/tests/test_db_pooling.py -v
```
* **Success Metric:** Database connections natively recycle disconnected instances without throwing 500 errors, and reads are cleanly decoupled from writes in the repository architecture.

---

## 📈 Execution & Audit Log

| Timestamp | Milestone | Status | Output Summary | Agent | Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-08-14T22:15:00+05:30` | `Milestone 4.1` | **COMPLETED** | Authored Alembic ↔ Supabase script. Sync natively compiles Python DDL changes to PostgreSQL .sql. | DevOps Architect | `5eacafe` |
| `2026-08-14T22:37:00+05:30` | `Milestone 4.2` | **COMPLETED** | Configured Testcontainers and SQLite fallback logic. All postgres skipif marks removed from test files. | SDET Engineer | `2205184` |
| `TBD` | `Milestone 4.3` | **PENDING** | Connection Pooling & Read-Replica Routing | Backend Engineer | Pending |
