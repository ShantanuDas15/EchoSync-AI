# EchoSync AI: Neural Zero-Shot Voice Synthesis Engine

> State-of-the-art zero-shot voice cloning and text-to-speech engine optimized for low-latency streaming and high-fidelity prosody alignment.

---

## Executive Architecture Summary

EchoSync AI decouples speaker identity extraction from acoustic spectrogram generation and neural vocoding. Built as a decoupled monorepo, the platform operates efficiently across free-tier cloud environments:

* **Frontend UI (Vercel):** Next.js 14 App Router, Web Audio API recorder, WaveSurfer.js playhead tracking.
* **API Control Plane (Render / Koyeb):** FastAPI Gateway (<180 MB RAM memory footprint) handling WebSockets & authentication.
* **Task Broker & Cache (Upstash Redis & Celery):** Asynchronous task orchestration and session cache.
* **ML Inference Engine (Hugging Face Spaces):** ONNX FP16 quantized model runtime (GE2E Speaker Encoder + FastSpeech 2 + HiFi-GAN Vocoder) running on CPU RAM nodes.
* **Persistence & Object Vault:** Supabase PostgreSQL (`pgvector` for 256-d d-vectors) & Cloudflare R2 (S3 API).

---

## Quickstart Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-username/echosync-ai.git
cd echosync-ai

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Backend Environment Setup

```bash
# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Repository Documentation

All comprehensive project specifications, phase execution blueprints, system architecture topographies, and directory structures have been organized into the [`docs/`](docs/) directory:

* 📐 [Technical Architecture & System Design Spec](docs/specifications/echosync_ai_voice_cloning_project_spec.md)
* ⚡ [Master Tech Stack Specification](docs/architecture/TECH_STACK.md)
* 📁 [Repository Directory Structure Specification](docs/architecture/PROJECT_STRUCTURE.md)
* 🚀 [Phase 1 Development Execution Plan](docs/plans/PHASE_1_DEVELOPMENT_PLAN.md)
* 📡 [Phase 2 Async & WebSocket Execution Plan](docs/plans/PHASE_2_DEVELOPMENT_PLAN.md)

---

## Security & Environment Variable Policy

* No raw `.env` files or secret credentials are tracked in Git.
* Refer to `.env.example`, `backend/.env.example`, and `frontend/.env.example` for environment variable configuration before deploying to production.

---

## License

[MIT License](LICENSE)
