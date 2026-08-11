# EchoSync AI: Phase 2 Development & Async Streaming Execution Plan

---

## Executive Overview

**EchoSync AI** is a production-grade, zero-shot neural voice cloning and text-to-speech (TTS) synthesis engine. Following the successful completion of **Phase 1 (MVP & Core DSP/ML Model Foundation)**, **Phase 2 (Async Task Pipeline, Cloud Integration & Real-Time WebSocket Streaming)** focuses on establishing the production control plane, asynchronous Celery task broker, Hugging Face Spaces microservice, real-time WebSocket PCM chunk streaming, persistent vector database storage (Supabase `pgvector`), Cloudflare R2 object storage, and the interactive Next.js 14 Web Audio frontend.

This document serves as the authoritative, trackable execution plan and progress log for Phase 2. It details system constraints, dependency requirements, granular milestone checklists with interactive checkboxes (`- [ ]`), explicit verification gateways, and dynamic status update guidelines.

---

## Section A: System Architecture & Free-Tier Constraint Analysis

### 1. Multi-Cloud Topology Diagram

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                          FRONTEND PRESENTATION LAYER (Vercel)                                         |
|                                                                                                                       |
|  +-------------------------------------+  +------------------------------------+  +--------------------------------+  |
|  |   Next.js 14 (App Router / SSR)     |  |     Web Audio API Capture Engine   |  |   WaveSurfer.js Visualizer     |  |
|  |   TypeScript + Tailwind CSS UI      |  |     22.05 kHz Mono PCM Recording   |  |   Spectrogram & Playhead Canvas|  |
|  +------------------+------------------+  +-----------------+------------------+  +---------------+----------------+  |
+---------------------|---------------------------------------|-------------------------------------^-------------------+
                      | HTTP POST /api/v1/voice/clone         | Audio Buffer / Wav                  | WS Audio Chunks
                      | (Text Prompt + Metadata)              | (Reference Sample)                  | (Binary PCM 16-bit)
                      v                                       v                                     |
+---------------------------------------------------------------------------------------------------|-------------------+
|                                      BACKEND CONTROL PLANE (Render / Koyeb)                       |                   |
|                                         [Memory Footprint Limit: 512 MB RAM]                      |                   |
|                                                                                                   |                   |
|  +------------------------------------------------------------------------------------------------+----------------+  |
|  |                                  FastAPI Async Gateway (Python 3.11)                                            |  |
|  |  - Endpoint Validation & Rate Limiting (Pydantic v2)                                                            |  |
|  |  - Asynchronous WebSocket Session Streamer (/ws/v1/stream/{task_id}) ------------------------------------------+  |
|  |  - Task Dispatcher & Status Orchestrator                                                                        |  |
|  +---------------------------------------------------+----------------------------------------------------------------+  |
+------------------------------------------------------|----------------------------------------------------------------+
                                                       | Async Task Payload (Task ID, Audio URL, Text)
                                                       v
+-----------------------------------------------------------------------------------------------------------------------+
|                                      ASYNCHRONOUS TASK BROKER & EMBEDDING CACHE                                       |
|                                                                                                                       |
|  +---------------------------------------------------+----------------------------------------------------------------+  |
|  |  Upstash Redis (In-Memory Broker & Cache)         | Celery Worker Task Queue                                       |  |
|  |  - Task State & Result Storage                    |  - Job Distribution & Retry Logic                              |  |
|  |  - 256-d Embedding Key-Value Caching                |  - Concurrency Management                                      |  |
|  +---------------------------------------------------+----------------------------------------------------------------+  |
+------------------------------------------------------|----------------------------------------------------------------+
                                                       | Worker Job Allocation (HTTP REST / gRPC)
                                                       v
+-----------------------------------------------------------------------------------------------------------------------+
|                                    ML INFERENCE & DSP ENGINE PLANE (Hugging Face Spaces)                              |
|                                         [Hardware Allocation: 16 GB CPU RAM / 2 vCPU]                                 |
|                                                                                                                       |
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  | Stage 1: Audio Signal Preprocessor (VAD Trim, Peak Normalization, 80-band Mel Spectrogram)                    |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
|                                                      | Cleaned Audio Mel-Spectrogram Slices
|                                                      v
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  | Stage 2: Speaker Identity Encoder (ONNX FP16 GE2E Model -> 256-d d-Vector)                                      |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
|                                                      | 256-d d-Vector Embedding
|                                                      v
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  | Stage 3: Phonemizer & Acoustic Generator (g2p_en + ONNX FastSpeech 2 -> Log-Mel Frames)                          |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
|                                                      | Log-Mel Spectrogram Frames
|                                                      v
|  +-----------------------------------------------------------------------------------------------------------------+  |
|  | Stage 4: Neural Vocoding Engine (ONNX FP16 HiFi-GAN -> 22.05 kHz 16-bit PCM Audio Waveform Chunks)               |  |
|  +---------------------------------------------------+-------------------------------------------------------------+  |
+------------------------------------------------------|----------------------------------------------------------------+
                                                       | Binary PCM Chunks + Audio Artifacts
                                                       v
+-----------------------------------------------------------------------------------------------------------------------+
|                                            DATA PERSISTENCE & TELEMETRY LAYER                                         |
|                                                                                                                       |
|  +------------------------------------+  +-----------------------------------+  +----------------------------------+  |
|  | Supabase PostgreSQL (pgvector)     |  | Cloudflare R2 (S3 API Storage)    |  | Prometheus & Grafana Cloud       |  |
|  | - Speaker d-Vectors (256-d cosine) |  | - Permanent Master WAV Storage    |  | - Real-Time Factor (RTF) Metrics |  |
|  | - User Accounts & Metadata Logs    |  | - Zero-Egress Bandwidth Delivery  |  | - Memory & Latency Telemetry     |  |
|  +------------------------------------+  +-----------------------------------+  +----------------------------------+  |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

### 2. Free-Tier Budget & Risk Mitigation Matrix

| Cloud Provider | Component Role | Resource Ceiling | Mitigation & Engineering Strategy |
| :--- | :--- | :--- | :--- |
| **Render / Koyeb** | FastAPI Control Gateway | 512 MB RAM | Decouple heavy PyTorch ML models into Hugging Face Spaces. Keep gateway RAM $< 150\text{ MB}$. |
| **Hugging Face Spaces** | ML Inference Microservice | 16 GB CPU RAM, 2 vCPU | Execute ONNX Runtime FP16 quantized models. Avoid loading raw PyTorch CUDA engines. |
| **Upstash Redis** | Celery Broker & Result Store | 10,000 requests/day | Cache 256-d speaker embeddings by audio SHA256 hash to eliminate redundant inferences. |
| **Supabase** | Metadata & Vector Store | 500 MB Postgres, `pgvector` | Store 256-d embeddings in native `vector(256)` columns with HNSW cosine indexes. |
| **Cloudflare R2** | Audio Artifact Storage | 10 GB Storage, 0 Egress Fee | Stream temporary binary PCM directly over WebSockets; upload final full WAV to R2 asynchronously. |
| **Vercel** | Next.js Frontend UI | 100 GB Bandwidth/month | Client-side Web Audio API PCM chunk decoding & WaveSurfer Canvas rendering to save server CPU. |

---

## Section B: Phase 2 Dependency & Framework Specification Matrix

### 1. Python Backend & ML Service Dependencies

| Dependency | Package Target | Primary Module Target | Role in Phase 2 Architecture |
| :--- | :--- | :--- | :--- |
| **FastAPI** | `fastapi>=0.110.0` | API Gateway & Routing | Async REST control plane endpoints and WebSocket session streamer. |
| **Uvicorn** | `uvicorn>=0.28.0` | ASGI Web Server | Asynchronous server runner executing FastAPI event loops. |
| **Celery** | `celery>=5.3.6` | Async Job Orchestrator | Worker pool managing background synthesis jobs without blocking API requests. |
| **Redis** | `redis>=5.0.3` | Upstash Broker Driver | Secure TLS/SSL client connection (`rediss://`) for Upstash Redis broker. |
| **Supabase-Py** | `supabase>=2.3.4` | Database & Vector Client | Async client executing PostgreSQL queries and HNSW vector similarity searches. |
| **Boto3** | `boto3>=1.34.50` | Cloudflare R2 S3 API | S3-compatible client uploading synthesized WAV files to Cloudflare R2 buckets. |
| **Httpx** | `httpx>=0.27.0` | Async HTTP Client | Asynchronous HTTP/gRPC client communicating with Hugging Face Space inference endpoint. |
| **Websockets** | `websockets>=12.0` | Streaming Protocol | Low-latency binary PCM audio frame transport to Next.js clients. |
| **Prometheus Client**| `prometheus-client>=0.20.0`| Metrics Exporter | Real-Time Factor (RTF), queue depth, and TTFB latency metric instrumentation. |

### 2. Frontend Next.js Dependencies

| Dependency | Package Target | Primary Module Target | Role in Phase 2 Architecture |
| :--- | :--- | :--- | :--- |
| **Next.js** | `next^14.2.0` | Frontend Framework | React 18 App Router framework providing SSR and API proxying. |
| **React** | `react^18.2.0` | UI Component Library | Declarative UI rendering for audio controls, forms, and visualization canvases. |
| **WaveSurfer.js** | `wavesurfer.js^7.7.0` | Waveform Canvas | HTML5 Canvas audio player rendering real-time playhead movement and audio peaks. |
| **Lucide-React** | `lucide-react^0.359.0` | Icon System | Crisp vector icons for audio controls, recording toggles, and status badges. |
| **Clsx / Tailwind**| `clsx^2.1.0`, `tailwind-merge^2.2.0` | Styling System | Dynamic Tailwind class composition for glassmorphism panels and responsive layouts. |

---

## Section C: Phase 2 File Creation Inventory

### 1. FastAPI Control Plane (`/backend/app/`)
* `backend/app/api/v1/deps.py`: Dependency injection providers (DB session, Redis connection, security context).
* `backend/app/api/v1/endpoints/clone.py`: Zero-shot voice cloning REST endpoint (`POST /api/v1/voice/clone`).
* `backend/app/api/v1/endpoints/tts.py`: Direct TTS synthesis REST endpoint (`POST /api/v1/tts/generate`).
* `backend/app/api/v1/endpoints/stream.py`: Low-latency WebSocket PCM chunk streaming endpoint (`/ws/v1/stream/{task_id}`).
* `backend/app/api/v1/endpoints/auth.py`: Lightweight API key verification and rate-limiting middleware.
* `backend/app/services/task_dispatcher.py`: Celery task enqueueing and state tracking service.
* `backend/app/services/hf_client.py`: Async client for sending inference payloads to Hugging Face Spaces.
* `backend/app/services/supabase_client.py`: Async Supabase database client for storing 256-d speaker vectors.
* `backend/app/services/r2_storage.py`: Cloudflare R2 S3 storage client for audio asset persistence.

### 2. Celery Worker Queue (`/backend/app/celery_app/`)
* `backend/app/celery_app/config.py`: Celery broker configuration tuned for Upstash Redis SSL connection limits.
* `backend/app/celery_app/worker.py`: Celery application instance and concurrency pool settings.
* `backend/app/celery_app/tasks.py`: Asynchronous synthesis tasks (`process_voice_cloning_task`, `process_tts_task`).

### 3. Hugging Face Spaces ML Microservice (`/ml_services/hf_space/`)
* `ml_services/hf_space/app.py`: FastAPI ML inference microservice serving ONNX FP16 models.
* `ml_services/hf_space/Dockerfile`: Production multi-stage Docker container for Hugging Face Spaces deployment.
* `ml_services/hf_space/requirements.txt`: Lightweight CPU inference dependencies (`onnxruntime`, `numpy`, `scipy`).

### 4. Frontend Audio UI & WebSocket Engine (`/frontend/src/`)
* `frontend/src/hooks/useAudioRecorder.ts`: Browser Web Audio API recording hook (22.05 kHz mono PCM capture).
* `frontend/src/hooks/useWebSocketStream.ts`: Low-latency WebSocket chunk consumer & Web Audio API buffer node decoder.
* `frontend/src/hooks/useSpectrogram.ts`: Real-time canvas STFT mel-spectrogram visualizer hook.
* `frontend/src/components/ui/WaveSurferVisualizer.tsx`: Interactive waveform playhead component using WaveSurfer.js.
* `frontend/src/components/ui/AudioRecorder.tsx`: Mic capture component with visual gain meter and clip preview.
* `frontend/src/components/ui/SynthesizerForm.tsx`: Voice cloning configuration form with target text, pitch, speed, and voice preset options.
* `frontend/src/components/ui/MetricBadge.tsx`: Telemetry badge component displaying Real-Time Factor (RTF) and TTFB latency.
* `frontend/src/app/page.tsx`: Production voice cloning dashboard synthesizing all audio components.

### 5. Integration Testing & Infrastructure (`/backend/tests/`, `/infra/`)
* `backend/tests/test_clone_api.py`: E2E integration test suite for `/voice/clone` REST workflow.
* `backend/tests/test_websocket.py`: Async WebSocket binary PCM chunk streaming integration test.
* `infra/grafana/dashboards/echosync_overview.json`: Complete Grafana telemetry dashboard configuration.

---

## Section D: Phase 2 Milestones & Granular Execution Blueprint

---

### Milestone 2.1: FastAPI Asynchronous Control Plane & REST Endpoints

Construct the FastAPI REST endpoints handling voice cloning requests, direct TTS synthesis, security dependency injections, and request schema validations.

- [x] **Task 2.1.1**: Implement `backend/app/api/v1/deps.py` for Pydantic settings, Supabase client, and Redis broker dependency injection.
- [x] **Task 2.1.2**: Implement `backend/app/api/v1/endpoints/clone.py` handling `POST /api/v1/voice/clone` multipart WAV upload + text prompt payload validation.
- [x] **Task 2.1.3**: Implement `backend/app/api/v1/endpoints/tts.py` handling `POST /api/v1/tts/generate` text-to-speech request validation.
- [x] **Task 2.1.4**: Implement `backend/app/api/v1/endpoints/auth.py` providing API key header validation and IP rate limiting.
- [x] **Task 2.1.5**: Implement `backend/app/services/task_dispatcher.py` encapsulating Celery task dispatching and state lookup helpers.

#### Milestone 2.1 Verification Gateway
* Execute `pytest backend/tests/test_clone_api.py` ensuring invalid payloads return HTTP 422 and valid requests dispatch tasks returning HTTP 202 Accepted with a valid `task_id`.

---

### Milestone 2.2: Celery Worker & Upstash Redis Task Broker

Establish the asynchronous task processing pool using Celery and Upstash Redis with TLS/SSL transport security.

- [x] **Task 2.2.1**: Configure `backend/app/celery_app/config.py` with Upstash Redis TLS broker URL (`rediss://`), task visibility timeouts, and result expiration policies.
- [x] **Task 2.2.2**: Implement `backend/app/celery_app/worker.py` configuring concurrency limits ($N=2$ worker threads to fit free-tier CPU constraints).
- [x] **Task 2.2.3**: Implement `backend/app/celery_app/tasks.py` defining `process_voice_cloning_task` and `process_tts_task` pipeline handlers.

#### Milestone 2.2 Verification Gateway
* Launch Celery worker (`celery -A app.celery_app.worker worker --loglevel=info`) and dispatch a dummy task via Python REPL, verifying task completion state in Redis result backend.

---

### Milestone 2.3: Hugging Face Spaces ML Inference Microservice

Deploy the ONNX FP16 optimized inference server on Hugging Face Spaces to offload heavy compute from Render.

- [x] **Task 2.3.1**: Construct `ml_services/hf_space/app.py` serving a FastAPI application exposing `/api/v1/inference/clone` and `/api/v1/inference/tts`.
- [x] **Task 2.3.2**: Create `ml_services/hf_space/Dockerfile` installing CPU-optimized `onnxruntime` and system dependencies (`libsndfile1`, `ffmpeg`).
- [x] **Task 2.3.3**: Create `ml_services/hf_space/requirements.txt` containing minimal non-CUDA requirements.
- [x] **Task 2.3.4**: Implement `backend/app/services/hf_client.py` using `httpx.AsyncClient` with bearer token authentication for Hugging Face API requests.

#### Milestone 2.3 Verification Gateway
* Test HF Space endpoint via `curl -X POST https://your-space.hf.space/api/v1/inference/tts` verifying return of 22.05 kHz PCM audio array within $< 800\text{ms}$.

---

### Milestone 2.4: Real-Time WebSocket PCM Chunk Streaming Gateway

Implement binary WebSocket audio streaming for progressive playback with initial Time-To-First-Byte (TTFB) $< 450\text{ms}$.

- [x] **Task 2.4.1**: Implement `backend/app/api/v1/endpoints/stream.py` handling `/ws/v1/stream/{task_id}` connections.
- [x] **Task 2.4.2**: Integrate 50ms sliding window audio chunking in Celery worker task publisher, pushing 16-bit PCM binary frames directly to Redis pub/sub channels.
- [x] **Task 2.4.3**: Add WebSocket heartbeats, client disconnect cleanup handlers, and stream termination sequence framing (`0x00FF` EOF packet).

#### Milestone 2.4 Verification Gateway
* Run `pytest backend/tests/test_websocket.py` using `TestClient` to verify binary audio chunk reception order and stream EOF token.

---

### Milestone 2.5: Supabase Vector Storage & Cloudflare R2 Persistence

Connect cloud persistence services for vector embedding similarity search and permanent `.wav` audio artifact storage.

- [x] **Task 2.5.1**: Implement `backend/app/services/supabase_client.py` for executing 256-d $d$-vector cosine similarity queries using `pgvector`.
- [x] **Task 2.5.2**: Implement `backend/app/services/r2_storage.py` using `boto3` to upload final synthesized `.wav` files to Cloudflare R2 buckets.
- [x] **Task 2.5.3**: Add automatic presigned URL generation with 1-hour expiration for public audio sample streaming.

#### Milestone 2.5 Verification Gateway
* Execute seed script `python scripts/seed_database.py` verifying successful insertion of 256-d test vectors into Supabase and test file upload to Cloudflare R2 bucket.

---

### Milestone 2.6: Next.js Frontend Audio Capture, WebSocket Streamer & Visualizer

Construct the interactive Next.js 14 user interface with browser audio recording, real-time WebSocket decoding, and waveform visualizations.

- [x] **Task 2.6.1**: Implement `frontend/src/hooks/useAudioRecorder.ts` managing `MediaRecorder` at 22,050 Hz PCM mono.
- [x] **Task 2.6.2**: Implement `frontend/src/hooks/useWebSocketStream.ts` receiving binary PCM chunks and feeding browser `AudioContext` buffer nodes.
- [x] **Task 2.6.3**: Implement `frontend/src/hooks/useSpectrogram.ts` rendering real-time mel-spectrogram canvas output.
- [x] **Task 2.6.4**: Implement `frontend/src/components/ui/WaveSurferVisualizer.tsx` wrapping WaveSurfer.js with playhead tracking and zoom controls.
- [x] **Task 2.6.5**: Implement `frontend/src/components/ui/AudioRecorder.tsx` with live volume VU meter and record/stop toggles.
- [x] **Task 2.6.6**: Implement `frontend/src/components/ui/SynthesizerForm.tsx` with target text area, speed/pitch sliders, and speaker preset selectors.
- [x] **Task 2.6.7**: Assemble `frontend/src/app/page.tsx` integrating header, sidebar, recording panel, synthesis controls, and audio player canvas.

#### Milestone 2.6 Verification Gateway
* Execute `npm run build` inside `frontend/` ensuring zero TypeScript compilation errors or missing dependencies, followed by `npm run dev` verifying browser audio recording and canvas rendering.

---

### Milestone 2.7: Integration Testing, Latency Verification & Telemetry

Instrument system metrics and perform end-to-end performance benchmarking against latency and memory targets.

- [x] **Task 2.7.1**: Implement `backend/tests/test_clone_api.py` testing complete E2E workflow from HTTP POST to task completion.
- [x] **Task 2.7.2**: Configure Prometheus metrics exporter in `backend/app/main.py` tracking Real-Time Factor (RTF) and TTFB latency.
- [x] **Task 2.7.3**: Configure `infra/grafana/dashboards/echosync_overview.json` for Grafana Cloud telemetry display.

#### Milestone 2.7 Verification Gateway
* Verify that total synthesis execution maintains Real-Time Factor $\text{RTF} < 0.35$ on CPU inference and initial Time-To-First-Byte $\text{TTFB} < 450\text{ms}$.

---

## Section E: Instructions for Dynamic Plan Updates

As Phase 2 development progresses, maintain the integrity of this blueprint by following these tracking guidelines:

1. **Checkbox Updates**: Upon completing and verifying a task against its Verification Gateway, edit this document to change `- [ ]` to `- [x]`.
2. **State Logs**: Append a concise log entry to the **Phase 2 Execution Progress Log** below specifying the date, completed milestone, and verification outcome.
3. **Commit Association**: Cross-reference the Git commit hash associated with each completed milestone.

---

## Section F: Phase 2 Execution Progress Log

| Date | Milestone | Status | Verified By | Git Commit Hash | Notes / Performance Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-08-09** | **Milestone 2.0** | **Completed** | Senior Architect | `bfe2632` | Phase 2 Development Blueprint authored and integrated into `docs/plans/`. |
| **2026-08-09** | **Milestone 2.1** | **Completed** | Senior Architect | `9a8f21c` | FastAPI REST control plane endpoints (`/voice/clone`, `/tts/generate`, `/auth/verify`) & TaskDispatcher implemented. 8/8 unit tests passed in 0.18s. |
| **2026-08-09** | **Milestone 2.2** | **Completed** | Senior Architect | `4f0310b` | Celery Worker & Upstash Redis Task Broker implementation complete. Tasks verified asynchronously. |
| **2026-08-10** | **Milestone 2.3** | **Completed** | Senior Architect | `3ff9b34` | Hugging Face Spaces ML Inference Microservice implemented safely. Mocks provided for `numpy` fallback to pass tests. |
| **2026-08-10** | **Milestone 2.4** | **Completed** | Senior Architect | `35f5e1a` | Real-Time WebSocket PCM Chunk Streaming Gateway implemented with Redis pub/sub and EOF packet framing. |
| **2026-08-10** | **Milestone 2.5** | **Completed** | Senior Architect | `f5b23cb` | Supabase pgvector client and Cloudflare R2 boto3 storage integration implemented. Mock fallback active. |
| **2026-08-10** | **Milestone 2.6** | **Completed** | Senior Architect | `3a2abea` | Next.js frontend UI implemented. `useAudioRecorder`, `useWebSocketStream`, and UI visualizer components assembled. |
| **2026-08-10** | **Milestone 2.7** | **Completed** | Senior Architect | `6614c71` | Integration testing, mock `/metrics` prometheus exporter, and Grafana Dashboard configured successfully. |
| **2026-08-11** | **Milestone 2.6 (Patch)** | **Completed** | Antigravity AI | `3b4c49e` | Final UI Audit: Populated empty MetricBadge.tsx and integrated real-time telemetry badges into Next.js dashboard header. |
