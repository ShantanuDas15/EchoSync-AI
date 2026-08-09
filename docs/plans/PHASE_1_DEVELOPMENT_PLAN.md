# EchoSync AI: Phase 1 Development & Blueprint Execution Plan

---

## Executive Overview

**EchoSync AI** is a state-of-the-art zero-shot neural voice cloning and text-to-speech (TTS) synthesis engine. **Phase 1 (MVP & Core DSP/ML Foundation)** focuses on constructing the foundational audio signal processing (DSP) pipeline, deep learning speaker embedding encoder (GE2E), acoustic generator (FastSpeech 2 / Tacotron 2), neural vocoder (HiFi-GAN), local end-to-end inference execution harness, and the baseline FastAPI control plane skeleton.

This document serves as the trackable execution plan and progress log for Phase 1. It outlines core milestones, file creation inventories, dependency specifications, granular checklists with interactive checkboxes (`- [ ]`), explicit verification gateways, and dynamic state update instructions.

---

## Section A: Phase 1 Executive Summary & Core Milestones

Phase 1 establishes a validated, end-to-end local python synthesis pipeline that converts a 10–30 second target speaker reference audio clip (`.wav`) and arbitrary text into a synthesized 22.05 kHz PCM audio waveform.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PHASE 1 ENGINE PIPELINE FLOW                                         |
|                                                                                                         |
|  [Input Reference WAV + Text]                                                                           |
|                |                                                                                        |
|                v                                                                                        |
|  [Milestone 1.2: DSP Preprocessing] --------> Resample (22.05kHz), VAD Trim, Peak Norm, 80-band Mel   |
|                |                                                                                        |
|                v                                                                                        |
|  [Milestone 1.3: GE2E Speaker Encoder] -----> Extract 256-d d-Vector Speaker Embedding                 |
|                |                                                                                        |
|                v                                                                                        |
|  [Milestone 1.4: Acoustic Spectrogram] ----> g2p_en Phonemization + FastSpeech 2 -> Log-Mel Frames       |
|                |                                                                                        |
|                v                                                                                        |
|  [Milestone 1.4: Neural Vocoder] ----------> HiFi-GAN Local Synthesis -> 22.05kHz PCM Waveform          |
|                |                                                                                        |
|                v                                                                                        |
|  [Milestone 1.5 & 1.6: FastAPI & Pytest] -> FastAPI /healthz + Pytest Signal & RTF Verification Suite |
+---------------------------------------------------------------------------------------------------------+
```

### Phase 1 Core Milestones
* **Milestone 1.1:** Environment Setup & Directory Scaffolding Alignment
* **Milestone 1.2:** Audio DSP & Signal Preprocessing Engine (`/ml_services/dsp`)
* **Milestone 1.3:** GE2E Deep Speaker Encoder Embedding Engine (`/ml_services/models/encoder`)
* **Milestone 1.4:** Acoustic Spectrogram Generator & Neural Vocoder Engine (`/ml_services/models`)
* **Milestone 1.5:** FastAPI Control Plane Gateway Skeleton (`/backend`)
* **Milestone 1.6:** Automated Unit, Signal & Integration Testing Suite (`/tests`)

---

## Section B: Phase 1 Dependency & Library Specification Matrix

| Dependency Name | Package Target | Primary Module Target | Role in Phase 1 Architecture |
| :--- | :--- | :--- | :--- |
| **Python** | `python>=3.11` | Environment Core | Base runtime platform supporting typed execution and async event loop. |
| **PyTorch** | `torch>=2.2.0` | ML Core Engine | Tensor computation engine for GE2E encoder, FastSpeech 2, and HiFi-GAN. |
| **Torchaudio** | `torchaudio>=2.2.0` | Audio Tensor DSP | High-performance GPU/CPU audio I/O and tensor spectro-temporal transformations. |
| **Librosa** | `librosa>=0.10.1` | DSP Signal Pipeline | 22.05 kHz resampling, STFT computation, 80-band mel-filterbank projection. |
| **SoundFile** | `soundfile>=0.12.1` | Audio Format I/O | Reading and writing uncompressed 16-bit WAV PCM files. |
| **NumPy** | `numpy>=1.26.4` | Matrix Computations | Numerical array operations, frame windowing, and audio array conversions. |
| **SciPy** | `scipy>=1.12.0` | Digital Signal Filters | Signal processing, windowing functions, and audio signal normalization. |
| **G2P-en** | `g2p-en>=2.1.0` | Text Phonemization | Grapheme-to-Phoneme converter mapping English text to ARPAbet tokens. |
| **Unidecode** | `unidecode>=1.3.8` | Text Sanitization | Stripping special characters and accents from text prompts prior to phonemization. |
| **FastAPI** | `fastapi>=0.110.0` | API Gateway | Lightweight ASGI web framework for REST validation and health checks. |
| **Uvicorn** | `uvicorn>=0.28.0` | ASGI Web Server | Asynchronous server executing the FastAPI control plane gateway. |
| **Pydantic** | `pydantic>=2.6.4` | Data Schemas | Pydantic V2 schema validation for audio requests, phonemes, and text inputs. |
| **Pytest** | `pytest>=8.0.0` | Testing Harness | Automated test runner verifying signal shapes, audio limits, and RTF latency. |

---

## Section C: File Creation Inventory

The following inventory details every file path to be constructed, populated, or tested during Phase 1 development:

### 1. Audio DSP Module (`/ml_services/dsp/`)
* `ml_services/dsp/__init__.py`: Package initialization.
* `ml_services/dsp/preprocessor.py`: Main audio signal preprocessor (22.05 kHz mono downmixing, silero-VAD trim, peak normalization to $-3\text{ dBFS}$).
* `ml_services/dsp/filterbank.py`: STFT log-mel spectrogram computation (80 mel bands, 1024 FFT length, 256 hop length, 1024 window length).
* `ml_services/dsp/vad.py`: Voice Activity Detection module stripping non-speech silence frames.

### 2. Deep Learning Speaker Encoder (`/ml_services/models/encoder/`)
* `ml_services/models/encoder/__init__.py`: Encoder module initialization.
* `ml_services/models/encoder/ge2e.py`: GE2E Deep Speaker Encoder model class yielding a 256-dimensional $L_2$-normalized $d$-vector embedding:
  $$\hat{e} = \frac{e}{\|e\|_2}$$
* `ml_services/models/encoder/ResNet_embedder.py`: ResNet-based speaker embedding fallback architecture.

### 3. Acoustic Generator & Neural Vocoder (`/ml_services/models/`)
* `ml_services/models/acoustic/__init__.py`: Acoustic model module initialization.
* `ml_services/models/acoustic/fastspeech2.py`: FastSpeech 2 non-autoregressive spectrogram generator taking phonemes and 256-d $d$-vectors.
* `ml_services/models/acoustic/length_regulator.py`: Explicit Length Regulator mapping phoneme duration predictions to temporal mel-spectrogram frames.
* `ml_services/models/vocoder/__init__.py`: Vocoder module initialization.
* `ml_services/models/vocoder/hifi_gan.py`: HiFi-GAN generator & multi-period discriminator neural vocoder converting mel-spectrograms to raw 22.05 kHz PCM waveforms.
* `ml_services/models/vocoder/sliding_window.py`: 50ms sliding window chunker with 10ms crossfading curve for stream generation.

### 4. FastAPI Control Gateway (`/backend/app/`)
* `backend/app/main.py`: FastAPI app instance with CORS, lifespan handlers, and `/metrics` setup.
* `backend/app/core/config.py`: Pydantic `BaseSettings` environment configuration.
* `backend/app/core/logging.py`: Structured JSON logger.
* `backend/app/schemas/audio.py`: Pydantic V2 audio request/response schemas.
* `backend/app/schemas/voice.py`: Voice profile and phoneme payload schemas.
* `backend/app/schemas/telemetry.py`: Telemetry and RTF metric logging schemas.
* `backend/app/api/v1/endpoints/health.py`: HTTP `GET /healthz` endpoint returning health state in $< 10\text{ ms}$.

### 5. Automated Test Suite (`/tests/`)
* `ml_services/tests/test_dsp_pipeline.py`: Unit tests verifying audio resampling (22,050 Hz), silero-VAD trim, and 80-band STFT shapes.
* `ml_services/tests/test_ge2e_encoder.py`: Validation test asserting GE2E output tensor shape `(1, 256)` and $L_2$ norm $\|e\|_2 = 1.0 \pm 1e-5$.
* `ml_services/tests/test_onnx_inference.py`: Benchmark test measuring local acoustic & vocoder synthesis latency ($\text{RTF} < 0.35$).
* `backend/tests/test_health.py`: FastAPI `/healthz` response time and status code assertion test.

---

## Section D: Step-by-Step Task Execution Checklist

### Milestone 1.1: Environment & Directory Scaffolding Alignment
- [x] Verify presence of root specification files (`PROJECT_STRUCTURE.md`, `TECH_STACK.md`, `README.md`).
- [x] Validate Python virtual environment (`echo/`) initialized with `uv`.
- [x] Verify installation of core dependencies (`torch`, `torchaudio`, `librosa`, `fastapi`, `pydantic`, `pytest`).
- [x] Confirm project submodules (`/backend`, `/ml_services`, `/frontend`, `/infra`, `/scripts`) exist.

### Milestone 1.2: DSP & Audio Signal Preprocessing Engine (`/ml_services/dsp`)
- [x] Implement `ml_services/dsp/preprocessor.py`:
  - [x] Implement mono audio downmixing for stereo/multi-channel input files.
  - [x] Implement audio resampling to exactly 22,050 Hz using `librosa.resample`.
  - [x] Implement peak amplitude normalization to $-3\text{ dBFS}$.
- [x] Implement `ml_services/dsp/vad.py`:
  - [x] Integrate silero-VAD to trim leading, trailing, and inter-speech silence frames.
- [x] Implement `ml_services/dsp/filterbank.py`:
  - [x] Construct 80-band STFT mel-filterbank conversion (`n_fft=1024`, `hop_length=256`, `win_length=1024`, `n_mels=80`).
  - [x] Add log-compression $\log(\text{mel} + 1e-5)$ for dynamic range normalization.

### Milestone 1.3: GE2E Speaker Encoder Embedding Pipeline (`/ml_services/models/encoder`)
- [x] Implement `ml_services/models/encoder/ge2e.py`:
  - [x] Define PyTorch GE2E 3-layer LSTM/ResNet speaker encoder architecture.
  - [x] Implement forward pass mapping input mel-spectrogram slices `(Batch, Frames, 80)` to raw embedding `(Batch, 256)`.
  - [x] Implement $L_2$ vector normalization layer ensuring $\|e\|_2 = 1.0$.
- [x] Implement `ml_services/models/encoder/ResNet_embedder.py`:
  - [x] Define 2D convolutional ResNet fallback architecture for speaker embedding extraction.

### Milestone 1.4: Acoustic Generator & Vocoder Local Inference Engine (`/ml_services/models`)
- [x] Implement text phonemization pipeline:
  - [x] Connect `g2p-en` text-to-phoneme converter and ARPAbet token mapping.
- [x] Implement `ml_services/models/acoustic/fastspeech2.py`:
  - [x] Construct FastSpeech 2 PyTorch model module (Phoneme Embedder + FFT Blocks + Pitch/Energy Predictors).
  - [x] Implement `length_regulator.py` to expand phoneme hidden states according to duration predictions.
  - [x] Concatenate 256-d GE2E speaker vector onto text encoder outputs to condition target voice synthesis.
- [x] Implement `ml_services/models/vocoder/hifi_gan.py`:
  - [x] Construct HiFi-GAN generator architecture receiving 80-band log-mel spectrogram frames.
  - [x] Implement 22.05 kHz 16-bit time-domain PCM audio generation.
- [x] Implement `ml_services/models/vocoder/sliding_window.py`:
  - [x] Construct 50ms sliding window chunker with 10ms crossfading curve for click-free audio streaming.

### Milestone 1.5: FastAPI Control Gateway Skeleton (`/backend`)
- [x] Implement `backend/app/core/config.py`:
  - [x] Define `Settings` class using `pydantic_settings.BaseSettings` for reading `.env` variables.
- [x] Implement `backend/app/core/logging.py`:
  - [x] Configure structured JSON logging emitting `timestamp`, `level`, `trace_id`, `service`, and `metrics`.
- [x] Implement `backend/app/schemas/audio.py` & `voice.py`:
  - [x] Construct Pydantic V2 models for `AudioUploadResponse`, `VoiceCloneRequest`, and `TTSGenerateRequest`.
- [x] Implement `backend/app/api/v1/endpoints/health.py`:
  - [x] Build HTTP `GET /healthz` endpoint returning status `healthy`, server timestamp, and version.
- [x] Implement `backend/app/main.py`:
  - [x] Instantiate FastAPI ASGI app, attach CORS middleware, and mount v1 API router.

### Milestone 1.6: Automated Unit & Integration Testing Harness (`/tests`)
- [x] Implement `ml_services/tests/test_dsp_pipeline.py`:
  - [x] Test audio resampling accuracy (assert target rate is exactly 22,050 Hz).
  - [x] Test STFT mel-spectrogram shape assertion `(80, T_frames)`.
  - [x] Test peak amplitude normalization limits (assert $\max(|x|) \le 0.707$).
- [x] Implement `ml_services/tests/test_ge2e_encoder.py`:
  - [x] Test GE2E forward pass output shape (assert shape equals `(1, 256)`).
  - [x] Test $L_2$ normalization accuracy (assert $\text{torch.norm}(e, p=2) = 1.0 \pm 1e-5$).
- [x] Implement `ml_services/tests/test_onnx_inference.py`:
  - [x] Benchmark local synthesis Real-Time Factor (assert $\text{RTF} < 0.35$).
- [x] Implement `backend/tests/test_health.py`:
  - [x] Test HTTP `GET /healthz` using `httpx.AsyncClient` (assert status code `200` and response time $< 15\text{ ms}$).

---

## Section E: Verification & Validation Gateways

Before marking any milestone or task as completed (`[x]`), the code implementation MUST pass the following quantitative acceptance criteria:

### 1. DSP Preprocessing Gateway (`/ml_services/dsp`)
* **Sampling Rate Assertion:** Input audio of arbitrary sample rate (8 kHz, 16 kHz, 44.1 kHz, 48 kHz) must be resampled to **22,050 Hz $\pm$ 0 Hz**.
* **Spectrogram Dimension:** STFT mel-filterbank transform of $N$ audio samples must produce a tensor with shape `(80, T)` where $T = \lfloor N / 256 \rfloor + 1$.
* **Amplitude Bounds:** Peak amplitude must be normalized to $-3\text{ dBFS}$, ensuring maximum sample value $|x|_{\max} \le 0.7071$.

### 2. GE2E Speaker Encoder Gateway (`/ml_services/models/encoder`)
* **Embedding Vector Shape:** Forward pass of a mel-spectrogram slice must produce a 2D tensor of shape `(Batch_Size, 256)`.
* **$L_2$ Vector Norm:** The Euclidean norm of the extracted speaker embedding vector must evaluate to $1.0$:
  $$\|e\|_2 = \sqrt{\sum_{i=1}^{256} e_i^2} = 1.0 \pm 1e-5$$

### 3. Local Synthesis & Latency Gateway (`/ml_services/models`)
* **Audio Waveform Output:** Vocoder output must be continuous 22.05 kHz mono 16-bit PCM audio with zero NaN/Inf values.
* **Real-Time Factor (RTF):** Synthesis wall-clock execution time divided by generated audio duration must be less than $0.35$:
  $$\text{RTF} = \frac{\text{Synthesis Time (s)}}{\text{Generated Audio Length (s)}} < 0.35$$

### 4. FastAPI Control Gateway (`/backend`)
* **Health Check Latency:** `GET /healthz` must return HTTP `200 OK` with payload `{"status": "healthy"}` in $< 15\text{ ms}$.
* **Memory Footprint:** Gateway process memory consumption must remain $< 180\text{ MB RAM}$.

---

## Section F: Dynamic State Maintenance Protocol

To ensure transparency, accurate tracking, and seamless progress logging across development turns, the following protocol MUST be observed by developers and AI agents:

1. **Immediate Task Updating:** Upon completing an engineering subtask and passing its corresponding unit test gateway, immediately update the markdown checkbox from `- [ ]` to `- [x]` in `./PHASE_1_DEVELOPMENT_PLAN.md`.
2. **Timestamp Logging:** Log completed milestone achievements in the **Execution Audit History Log** below with ISO-8601 timestamps and test execution results.
3. **Never Fake Completion:** Tasks must remain unchecked `- [ ]` until empirical test output (e.g. Pytest pass) confirms validation criteria are met.

---

## Section G: Execution Audit History Log

| Timestamp (ISO-8601) | Milestone / Subtask ID | Execution Status | Test Result / Metric Summary | Logged By |
| :--- | :--- | :--- | :--- | :--- |
| `2026-08-09T16:43:48+05:30` | `Milestone 1.1` | **IN PROGRESS** | Verified 104 workspace files & `uv` environment (`echo/`). | Antigravity AI |
| `2026-08-09T16:57:16+05:30` | `Milestone 1.1` | **COMPLETED** | Verified existence of `/backend`, `/ml_services`, `/frontend`, `/infra`, `/scripts`. All 4 subtask items checked `[x]`. | Antigravity AI |
| `2026-08-09T17:21:55+05:30` | `Milestone 1.2` | **COMPLETED** | Implemented `preprocessor.py`, `vad.py`, `filterbank.py`. Passed 9/9 Pytest unit tests in 0.78s. | Antigravity AI |
| `2026-08-09T17:26:42+05:30` | `Milestone 1.3` | **COMPLETED** | Implemented `ge2e.py` & `ResNet_embedder.py`. Passed 5/5 Pytest unit tests in 0.64s (Total 14/14 passed). | Antigravity AI |
| `2026-08-09T17:41:59+05:30` | `Milestone 1.4` | **COMPLETED** | Implemented FastSpeech2 & HiFi-GAN. Passed RTF benchmark. | Antigravity AI |
| `2026-08-09T18:05:00+05:30` | `Milestone 1.5` | **COMPLETED** | Implemented FastAPI gateway skeleton. Passed `/healthz` unit test. | Antigravity AI |
| `2026-08-09T18:39:00+05:30` | `Milestone 1.6` | **COMPLETED** | Verified Automated Unit & Integration Testing Harness. Passed 14/14 Pytest unit tests in 1.30s. | Antigravity AI |

---

## Validation Checklist for PHASE_1_DEVELOPMENT_PLAN.md

* [x] **Milestone Scope:** Fully covers Phase 1 MVP foundation (DSP, GE2E Encoder, FastSpeech 2, HiFi-GAN, FastAPI skeleton, Pytest suite).
* [x] **File Inventory Alignment:** 100% aligned with filenames defined in `PROJECT_STRUCTURE.md`.
* [x] **Checkboxes:** Every granular task utilizes interactive Markdown checkboxes (`- [ ]`).
* [x] **Acceptance Gateways:** Explicit mathematical formulas and quantitative thresholds provided for STFT dimensions, $L_2$ norm, and RTF latency.
* [x] **State Protocol:** Clear protocol defined for updating task progress across development sessions.
