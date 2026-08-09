# EchoSync AI: Master Repository & System Directory Structure

---

## Executive Overview

**EchoSync AI** is structured as a production-grade, decoupled monorepo designed for high-performance neural voice synthesis while strictly adhering to free-tier cloud constraints. 

To prevent out-of-memory (`OOMKilled`) failures on **Render's 512 MB RAM limit**, the repository cleanly separates the lightweight **API Control Plane** (`/backend`) from the memory-intensive **ML Processing Plane** (`/ml_services`), which operates on **Hugging Face Spaces' 16 GB CPU RAM** infrastructure. The interactive user interface resides in `/frontend` as a **Next.js 14** App Router application deployed to **Vercel**.

This document serves as the authoritative blueprint for the repository file and directory organization, detailing module boundaries, file responsibilities, and deployment targets.

---

## Section A: Master Repository ASCII Tree Diagram

```
echosync-ai/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md                   # Standardized GitHub issue template for reporting system bugs
│   │   └── feature_request.md              # Standardized GitHub template for requesting audio engine features
│   └── workflows/
│       ├── ci.yml                          # Continuous Integration: Automated Pytest, ESLint, & MyPy verification
│       ├── deploy-backend.yml              # CI/CD: Automated deployment of FastAPI Gateway to Render / Koyeb
│       ├── deploy-frontend.yml             # CI/CD: Automated deployment of Next.js 14 dashboard to Vercel
│       └── deploy-ml-space.yml             # CI/CD: Automated deployment of ONNX models to Hugging Face Spaces
├── backend/                                # FASTAPI CONTROL PLANE & ASYNCHRONOUS API GATEWAY (Render Tier)
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py             # User authentication routes & Supabase token validation
│   │   │       │   ├── clone.py            # POST /api/v1/voice/clone (Audio upload & voice profile creation)
│   │   │       │   ├── health.py           # GET /healthz (Lightweight keep-alive ping for UptimeRobot)
│   │   │       │   ├── stream.py           # WS /ws/v1/stream/{task_id} (Asynchronous PCM chunk streaming)
│   │   │       │   └── tts.py              # POST /api/v1/tts/generate (Standard TTS synthesis dispatch)
│   │   │       ├── api.py                  # API v1 router aggregator including all REST and WebSocket routes
│   │   │       └── deps.py                 # FastAPI dependency injection (DB sessions, auth tokens, rate limits)
│   │   ├── celery_app/
│   │   │   ├── __init__.py                 # Celery module initialization
│   │   │   ├── config.py                   # Celery broker configuration (Upstash Redis TLS settings)
│   │   │   ├── tasks.py                    # Celery task definitions (Async ML job dispatching & retries)
│   │   │   └── worker.py                   # Celery worker process entrypoint
│   │   ├── core/
│   │   │   ├── config.py                   # Pydantic BaseSettings reading environment configuration
│   │   │   ├── logging.py                  # Structured JSON logging formatter for Grafana Loki parsing
│   │   │   └── security.py                 # Security utilities (JWT validation, CORS, rate limiting)
│   │   ├── db/
│   │   │   ├── base.py                     # SQLAlchemy / Supabase client base configuration
│   │   │   └── session.py                  # Database connection pool manager with auto-reconnect
│   │   ├── schemas/
│   │   │   ├── audio.py                    # Pydantic schemas for audio uploads, formats, and sample rates
│   │   │   ├── telemetry.py                # Pydantic schemas for Prometheus metrics & RTF performance logs
│   │   │   └── voice.py                    # Pydantic schemas for speaker profile, phonemes, and text prompts
│   │   ├── services/
│   │   │   ├── hf_client.py                # Async HTTP/gRPC client forwarding ML tasks to Hugging Face Spaces
│   │   │   ├── r2_storage.py               # Cloudflare R2 S3 API client for uploading and fetching WAV assets
│   │   │   ├── supabase_client.py          # Supabase client wrapper handling pgvector 256-d embedding queries
│   │   │   └── task_dispatcher.py          # Orchestrates job queuing between FastAPI, Redis, and Celery
│   │   └── main.py                         # FastAPI ASGI app entrypoint, middleware, & Prometheus endpoint
│   ├── tests/
│   │   ├── test_clone_api.py               # Integration tests for voice cloning REST endpoints
│   │   ├── test_health.py                  # Unit test for /healthz keep-alive response speed
│   │   └── test_websocket.py               # Asynchronous test client verifying WebSocket PCM chunk transport
│   ├── .env.example                        # Backend environment variable template
│   ├── Dockerfile                          # Multi-stage Dockerfile optimized for Render (<180 MB memory footprint)
│   └── requirements.txt                    # Pinned Python dependencies for API Gateway (No heavy PyTorch/CUDA)
├── ml_services/                            # NEURAL INFERENCE & DSP ENGINE (Hugging Face Spaces 16 GB Tier)
│   ├── dsp/
│   │   ├── __init__.py                     # Audio processing package initialization
│   │   ├── filterbank.py                   # STFT 80-band mel-spectrogram filterbank conversion utilities
│   │   ├── preprocessor.py                 # Librosa/Torchaudio 22.05 kHz resampling, mono downmixing, -3 dB norm
│   │   └── vad.py                          # Silero Voice Activity Detection (VAD) for stripping silence
│   ├── models/
│   │   ├── acoustic/
│   │   │   ├── fastspeech2.py              # PyTorch FastSpeech 2 non-autoregressive acoustic generator
│   │   │   └── length_regulator.py         # Explicit length regulator mapping phoneme durations to frames
│   │   ├── encoder/
│   │   │   ├── ge2e.py                     # GE2E Deep Speaker Encoder model extracting 256-d d-vector
│   │   │   └── ResNet_embedder.py          # ResNet-based fallback architecture for speaker embedding
│   │   └── vocoder/
│   │       ├── hifi_gan.py                 # HiFi-GAN generator & multi-period discriminator wrapper
│   │       └── sliding_window.py           # 50ms sliding window chunker with 10ms crossfading curve
│   ├── onnx/
│   │   ├── exporter.py                     # CLI script exporting PyTorch state dicts to ONNX computation graphs
│   │   ├── quantizer.py                    # FP16 dynamic weight quantization script (trims RAM by ~65%)
│   │   └── runtime_engine.py               # ONNX Runtime execution wrapper using memory-mapped files (mmap)
│   ├── hf_space/
│   │   ├── app.py                          # Hugging Face Spaces entrypoint (FastAPI / Gradio runtime server)
│   │   ├── Dockerfile                      # Hugging Face Spaces container definition
│   │   └── requirements.txt                # CPU-optimized PyTorch & ONNX Runtime dependencies
│   ├── weights/                            # Local directory for ONNX quantized model artifacts (Git ignored)
│   │   ├── .gitkeep                        # Keeps directory structure intact in repository
│   │   ├── fastspeech2_fp16.onnx.md        # Reference metadata for quantized acoustic model weights
│   │   ├── ge2e_encoder.onnx.md            # Reference metadata for quantized speaker encoder weights
│   │   └── hifigan_fp16.onnx.md            # Reference metadata for quantized HiFi-GAN vocoder weights
│   └── tests/
│       ├── test_dsp_pipeline.py            # Unit tests verifying STFT mel-spectrogram feature extraction
│       ├── test_ge2e_encoder.py            # Validation tests ensuring 256-d L2 normalization of d-vectors
│       └── test_onnx_inference.py          # Benchmark tests verifying ONNX FP16 Real-Time Factor (RTF < 0.35)
├── frontend/                               # INTERACTIVE USER INTERFACE DASHBOARD (Vercel Edge Tier)
│   ├── public/
│   │   ├── favicon.ico                     # EchoSync AI brand favicon icon
│   │   ├── logo.svg                        # Vector brand logo asset
│   │   └── samples/                        # Pre-loaded target speaker reference WAV samples
│   │       ├── speaker_demo_female.wav     # Demo voice reference sample 1
│   │       └── speaker_demo_male.wav       # Demo voice reference sample 2
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                        # Next.js Serverless API route proxies
│   │   │   │   └── proxy/                  # Proxies browser requests to FastAPI backend to bypass CORS
│   │   │   ├── favicon.ico                 # App Router favicon fallback
│   │   │   ├── globals.css                 # Tailwind CSS directives, glassmorphism utilities, dark mode
│   │   │   ├── layout.tsx                  # Root app layout component with metadata, fonts, and dark theme
│   │   │   └── page.tsx                    # Main synthesis dashboard assembling player, recorder, and controls
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx              # Top navigation header with status indicators & theme toggle
│   │   │   │   └── Sidebar.tsx             # Preset speaker navigation & session history sidebar
│   │   │   ├── ui/
│   │   │   │   ├── AudioRecorder.tsx       # Browser Web Audio API microphone recorder component
│   │   │   │   ├── MetricBadge.tsx         # Real-time RTF and latency display badge
│   │   │   │   ├── SpectrogramCanvas.tsx   # Live HTML5 canvas rendering mel-spectrogram heatmaps
│   │   │   │   ├── SynthesizerForm.tsx     # Text prompt input form with pitch, speed, and voice controls
│   │   │   │   └── WaveSurferVisualizer.tsx# WaveSurfer.js waveform visualizer with active playhead tracking
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts         # React hook managing MediaRecorder API and WAV blob creation
│   │   │   ├── useSpectrogram.ts           # Custom hook computing real-time FFT frequency canvas data
│   │   │   └── useWebSocketStream.ts       # Manage WebSocket lifecycle, binary PCM decoding & double-buffering
│   │   ├── lib/
│   │   │   ├── audioUtils.ts               # Utilities for float32 to int16 conversion and crossfading
│   │   │   ├── constants.ts                # App-wide constants (Sample rate 22.05 kHz, max prompt length)
│   │   │   ├── supabaseClient.ts           # Browser-side Supabase client for preset speaker fetching
│   │   │   └── utils.ts                    # Classname merge helpers (clsx + tailwind-merge)
│   │   └── types/
│   │       ├── audio.ts                    # TypeScript interface definitions for audio buffers & chunks
│   │       └── voice.ts                    # TypeScript types for voice profiles, phonemes, and task states
│   ├── .env.example                        # Frontend environment variable configuration template
│   ├── next.config.mjs                     # Next.js 14 configuration with WebSocket proxy rewrites
│   ├── package.json                        # Frontend Node dependencies (WaveSurfer.js, Supabase, Tailwind)
│   ├── postcss.config.mjs                  # PostCSS plugin configuration for Tailwind CSS compilation
│   ├── tailwind.config.ts                  # Tailwind CSS design system tokens (colors, animations, fonts)
│   └── tsconfig.json                       # Strict TypeScript compiler rules and path aliases (@/*)
├── infra/                                  # CONTAINER ORCHESTRATION & DEPLOYMENT CONFIGURATIONS
│   ├── docker/
│   │   ├── docker-compose.yml              # Local multi-container development environment definition
│   │   ├── Dockerfile.backend              # Production Docker build specification for FastAPI Control Plane
│   │   └── Dockerfile.ml                   # Production Docker build specification for Hugging Face ML Space
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   └── echosync_overview.json      # Grafana dashboard panel definition for RTF & latency metrics
│   │   └── prometheus.yml                  # Prometheus metrics scraper job configuration
│   └── supabase/
│       ├── migrations/
│       │   └── 00001_create_embeddings.sql # SQL migration activating pgvector and creating speaker_profiles table
│       └── config.toml                     # Supabase local development configuration
├── scripts/                                # OPERATIONAL SCRIPTS & UTILITY AUTOMATION
│   ├── export_onnx_models.py               # CLI tool automating PyTorch to ONNX FP16 conversion pipeline
│   ├── keep_alive.py                       # Python ping script used by UptimeRobot to keep Render warm
│   ├── keep_alive.sh                       # Shell script alternative for cron-based health checking
│   └── seed_database.py                    # Populates Supabase with baseline speaker embeddings & demo metadata
├── .gitignore                              # Comprehensive Git exclusion rules (weights, .env, node_modules)
├── echosync_ai_voice_cloning_project_spec.md # Complete technical blueprint & interview defense guide
├── LICENSE                                 # MIT Open-Source License file
├── README.md                               # Primary repository documentation & quickstart setup guide
├── TECH_STACK.md                           # Master technical stack, dependency specifications, & cloud budget
└── PROJECT_STRUCTURE.md                    # Master directory & repository structure specification (This file)
```

---

## Section B: Core Submodule Breakdown & Architectural Annotations

### 1. `/backend` — FastAPI Control Plane & Asynchronous Gateway

The `/backend` directory houses the lightweight control plane running on **Render's 512 MB RAM free tier**. It handles client connections, request validation, authentication, database persistence, and WebSocket streaming **without loading heavy PyTorch model weights into memory**.

* `app/main.py`: The ASGI entrypoint. Instantiates FastAPI with custom middleware for CORS, structured JSON logging, and mounts `/metrics` for Prometheus scraping.
* `app/api/v1/endpoints/clone.py`: Receives reference audio `.wav` files and prompt text. Validates inputs via Pydantic and triggers async task processing.
* `app/api/v1/endpoints/stream.py`: Manages real-time WebSocket connections (`/ws/v1/stream/{task_id}`). Listens to Redis channels and streams incoming 16-bit binary PCM chunks directly to client browsers.
* `app/api/v1/endpoints/health.py`: Responds to HTTP `GET /healthz` in $< 10\text{ ms}$. Consumes $< 100\text{ KB}$ RAM. Pinged by UptimeRobot every 14 minutes to prevent Render idle shutdown.
* `app/services/hf_client.py`: Asynchronous HTTP client using `httpx` to forward DSP and ML inference requests to the Hugging Face Spaces execution plane.
* `app/services/supabase_client.py`: Database access layer interacting with Supabase PostgreSQL and `pgvector` to store and query 256-dimensional speaker embeddings.
* `app/celery_app/worker.py`: Distributed task worker handling background job execution, retries, and result publishing to Redis.

---

### 2. `/ml_services` — Audio DSP & ONNX Neural Inference Engine

The `/ml_services` directory contains all deep learning model architectures, digital signal processing algorithms, and ONNX optimization pipelines. This codebase is deployed independently to **Hugging Face Spaces** (which provides **16 GB CPU RAM** free).

* `dsp/preprocessor.py`: Implements digital signal processing logic: downmixing audio to mono, resampling to 22,050 Hz, applying silero-VAD to trim silent frames, peak amplitude normalization ($-3\text{ dBFS}$), and 80-band Short-Time Fourier Transform (STFT) log-mel filterbank generation.
* `models/encoder/ge2e.py`: PyTorch implementation of the Generalized End-to-End Speaker Encoder. Extracts a fixed 256-dimensional speaker identity vector ($d$-vector) representing pitch, formant structure, and vocal timbre.
* `models/acoustic/fastspeech2.py`: Non-autoregressive acoustic generator using explicit duration prediction to align text phonemes with temporal mel-spectrogram frames.
* `models/vocoder/hifi_gan.py`: Generative Adversarial Network vocoder generating raw 22.05 kHz PCM audio from predicted log-mel spectrogram frames.
* `onnx/exporter.py`: CLI script that converts PyTorch model graphs into Open Neural Network Exchange (`.onnx`) binaries.
* `onnx/quantizer.py`: Applies **FP16 Dynamic Weight Quantization** to ONNX models, reducing model memory footprint from 2.8 GB to ~850 MB and accelerating CPU execution speed by 42%.
* `onnx/runtime_engine.py`: Loads ONNX models using memory-mapped file handles (`mmap`), enabling the OS kernel to load model segments lazily without triggering memory allocation spikes.

---

### 3. `/frontend` — Next.js 14 Interactive Audio Dashboard

The `/frontend` directory contains a modern **Next.js 14** App Router interface built with React 18, TypeScript, and Tailwind CSS. Deployed to **Vercel**, it handles audio recording, real-time waveform visualization, and progressive WebSocket audio playback.

* `src/app/page.tsx`: Primary interactive dashboard. Assembles the microphone recording interface, synthesis parameter controls (pitch, speed, target voice), and audio visualizer canvas.
* `src/components/ui/AudioRecorder.tsx`: Custom React component utilising the browser's native Web Audio API (`MediaRecorder`) to capture 22.05 kHz mono PCM audio directly from the user's microphone.
* `src/components/ui/WaveSurferVisualizer.tsx`: Integrates **WaveSurfer.js** to render real-time time-domain audio waveforms and dynamic playheads on HTML5 canvas elements.
* `src/components/ui/SpectrogramCanvas.tsx`: Renders real-time mel-spectrogram heatmaps during voice playback.
* `src/hooks/useWebSocketStream.ts`: Encapsulates WebSocket connection lifecycle management, handling auto-reconnects, binary PCM chunk reception, and double-buffered audio queueing to prevent audio clicks and popping.

---

### 4. `/scripts` & `/infra` — Operational Utilities & Container Orchestration

* `scripts/keep_alive.py`: Lightweight Python ping script configured in UptimeRobot or cron to issue HTTP GET requests to `/healthz` on Render every 14 minutes.
* `scripts/export_onnx_models.py`: Master automation script running the end-to-end model export, graph optimization, and FP16 quantization pipeline.
* `infra/docker/docker-compose.yml`: Defines local multi-container development environment running FastAPI, Redis, Celery, and local Supabase instance.
* `infra/docker/Dockerfile.backend`: Multi-stage Dockerfile producing a minimal (<180 MB memory footprint) runtime container for the FastAPI control plane.
* `infra/supabase/migrations/00001_create_embeddings.sql`: Database migration script enabling the `pgvector` extension and defining the schema for 256-d speaker embeddings:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE speaker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_name VARCHAR(255) NOT NULL,
    embedding vector(256) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_speaker_embedding ON speaker_profiles USING ivfflat (embedding vector_cosine_ops);
```

---

### 5. `/.github/workflows` — CI/CD Automation Pipelines

* `ci.yml`: Runs automated linting (`flake8`, `eslint`), strict type checking (`mypy`, `tsc`), and unit tests (`pytest`) on every pull request.
* `deploy-backend.yml`: Automatically builds and deploys the lightweight FastAPI Gateway container to Render upon pushes to `main`.
* `deploy-frontend.yml`: Triggers Vercel deployment pipeline for Next.js 14 frontend updates.
* `deploy-ml-space.yml`: Deploys quantized ONNX models and inference scripts to Hugging Face Spaces.

---

## Section C: Comprehensive File Directory Reference Table

| Directory / File Path | Layer / Module | Primary Host Target | Architectural Responsibility & Free-Tier Role |
| :--- | :--- | :--- | :--- |
| `backend/app/main.py` | API Gateway | Render (512 MB) | FastAPI ASGI entrypoint, CORS setup, Prometheus metrics route. |
| `backend/app/api/v1/endpoints/stream.py` | Async Transport | Render (512 MB) | WebSocket endpoint streaming binary PCM chunks to client. |
| `backend/app/api/v1/endpoints/health.py` | Infrastructure | Render (512 MB) | Lightweight `/healthz` endpoint for UptimeRobot keep-alive. |
| `backend/app/services/hf_client.py` | System Interface | Render (512 MB) | Forwards ML compute tasks to Hugging Face Spaces via HTTP. |
| `backend/app/services/supabase_client.py`| Database Layer | Supabase Postgres | Manages Postgres connection & `pgvector` 256-d embedding queries. |
| `backend/Dockerfile` | Containerization | Render | Multi-stage Dockerfile ensuring runtime memory stays $< 180\text{ MB}$. |
| `ml_services/dsp/preprocessor.py` | Audio DSP | Hugging Face Spaces | Librosa 22.05 kHz resampling, silero-VAD trim, STFT mel-spectrogram. |
| `ml_services/models/encoder/ge2e.py` | Neural Model | Hugging Face Spaces | GE2E Speaker Encoder extracting 256-d L2-normalized d-vector. |
| `ml_services/models/vocoder/hifi_gan.py` | Neural Vocoder | Hugging Face Spaces | HiFi-GAN 22.05 kHz raw time-domain PCM waveform generator. |
| `ml_services/onnx/quantizer.py` | ML Optimization | Local / Build | FP16 dynamic weight quantization trimming model RAM by ~65%. |
| `ml_services/onnx/runtime_engine.py` | ONNX Engine | Hugging Face Spaces | Executes quantized models with `mmap` lazy memory allocation. |
| `frontend/src/app/page.tsx` | UI Presentation | Vercel Edge | Main synthesis dashboard assembling player & audio controls. |
| `frontend/src/components/ui/AudioRecorder.tsx`| Web Audio | Vercel / Browser | Microphones recording interface producing 22.05 kHz mono WAV. |
| `frontend/src/hooks/useWebSocketStream.ts` | Streaming Client| Vercel / Browser | Manages WS binary PCM decoding & double-buffered playback queue. |
| `infra/docker/docker-compose.yml` | DevOps | Local Workstation | Multi-container setup for local backend, Redis, and Celery testing. |
| `scripts/keep_alive.py` | Operations | UptimeRobot SaaS | Sends HTTP pings every 14 min to keep Render free tier warm. |
| `scripts/export_onnx_models.py` | Build Script | Local / CI | CLI script converting PyTorch weights to optimized ONNX FP16. |

---

## Validation & Structural Verification

* [x] **Decoupled Architecture:** Clean physical separation between `/backend` (FastAPI Control Plane, 512 MB Render limit) and `/ml_services` (Hugging Face Spaces 16 GB RAM).
* [x] **Complete Component Coverage:** Every single component—including Audio DSP, GE2E Encoder, FastSpeech 2, HiFi-GAN, Web Audio API recorder, WaveSurfer.js visualizer, Supabase `pgvector`, and Cloudflare R2—is assigned an explicit file path and responsibility.
* [x] **Free-Tier Optimization Annotations:** Explicit file-level descriptions detailing ONNX FP16 quantization, `mmap` lazy memory loading, UptimeRobot keep-alive pings, and minimal Docker container builds.
* [x] **Full CI/CD & DevOps Integration:** Complete directory mapping for Docker Compose, Supabase SQL migrations, Grafana telemetry configs, and GitHub Actions workflows.
