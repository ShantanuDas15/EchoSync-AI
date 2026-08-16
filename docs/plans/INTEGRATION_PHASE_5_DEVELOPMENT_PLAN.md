# EchoSync AI - Phase 5: Production Backend Integration & Asynchronous Synchronization

## Overview
This phase bridges the gap between the beautifully designed frontend interface and the robust, production-grade Python FastAPI backend. Currently, the frontend operates primarily on mock data and simulated syntheses. This phase will wire up the actual async architecture: dispatching voice cloning tasks, polling for completion, fetching secure pre-signed audio stream URLs from R2 storage, and piping the neural WS streams.

## Core Implementation Workflow Reminder
1. **Implement**: Write code as specified in the milestone documentation.
2. **Verify, Validate & Test**: Run precise verification gateways. Use mocks (MSW or Jest fetch mocks) to test the API client safely.
3. **Clean & Isolate**: Scrub stray `__pycache__` folders and ensure `.env` keys aren't committed.
4. **Commit & Push**: Follow clean commit guidelines.
5. **Track Progress**: Update this Markdown file's Execution Audit History Log.

---

### Milestone 5.1: Core API Client & Authentication Layer
Establish a strongly-typed foundation for network operations to communicate securely with the FastAPI backend.

- [x] **Task 5.1.1**: Implement `frontend/src/lib/apiClient.ts` wrapper (e.g., using native `fetch` or `axios`) pointing to the `/api/v1` base URL with default timeouts.
- [x] **Task 5.1.2**: Add request interceptors or middleware to securely append the `X-API-Key` authentication header to every outgoing request.
- [x] **Task 5.1.3**: Create `frontend/src/types/api.ts` defining TypeScript interfaces that exactly match the backend Pydantic models (`TaskStatusResponse`, `VoiceCloneResponse`, `TTSGenerateRequest`).

#### Verification Gateway & Test Design
* **Unit Test (`ApiClient.test.ts`):** Assert that the API client correctly injects headers, handles 401 Unauthorized responses gracefully, and formats JSON body payloads.

---

### Milestone 5.2: Asynchronous Task Polling & Streaming Hooks
The backend processes intensive DSP tasks asynchronously via Celery/Redis, returning a `task_id`. The frontend must poll for the result.

- [ ] **Task 5.2.1**: Develop a `useTaskPolling.ts` custom React hook that takes a `task_id` and polls `/api/v1/voice/tasks/{task_id}` using exponential backoff (e.g., 1s, 2s, 4s) until status is `completed` or `failed`.
- [ ] **Task 5.2.2**: Integrate the polling hook with the existing `useWebSocketStream.ts`. The websocket should only connect to `/ws/v1/stream/{task_id}` once the polling status confirms the audio buffer is ready to stream.

#### Verification Gateway & Test Design
* **Unit Test (`TaskPolling.test.ts`):** Use `jest.useFakeTimers()` to verify that the polling hook respects the backoff intervals and correctly updates state upon receiving a `completed` or `failed` payload.

---

### Milestone 5.3: Zero-Shot Voice Cloning Dispatch
Connect the Voice Recorder UI to the actual zero-shot voice cloning pipeline.

- [ ] **Task 5.3.1**: Modify `page.tsx`'s `handleMasterRender` function to assemble a `FormData` object containing the `referenceAudio` blob, script text, and optional voice name.
- [ ] **Task 5.3.2**: Execute a `POST /api/v1/voice/clone` request, retrieve the `task_id`, and feed it into the `useTaskPolling` hook to start the lifecycle.
- [ ] **Task 5.3.3**: Ensure `ErrorState` components are rendered seamlessly if the cloning API rejects the file (e.g., file too large, invalid format).

#### Verification Gateway & Test Design
* **Integration Test (`VoiceCloneIntegration.test.ts`):** Mock the network layer to simulate a successful `POST /voice/clone` and verify that the application state transitions from "Uploading" to "Processing" to "Streaming".

---

### Milestone 5.4: Cloud Storage & Secure Media Playback
Replace mock local blob URLs with authenticated, pre-signed URLs from the backend R2 bucket.

- [ ] **Task 5.4.1**: Implement a helper function `fetchPresignedUrl(assetId)` hitting `GET /api/v1/audio/{asset_id}/stream-url`.
- [ ] **Task 5.4.2**: Refactor `VoiceCard.tsx` and `WaveSurferVisualizer.tsx` to accept an `assetId` instead of an `audioUrl`, fetching the pre-signed URL dynamically when playback is triggered.
- [ ] **Task 5.4.3**: Add error handling for expired pre-signed URLs to re-fetch automatically if a 403 Forbidden is encountered during playback.

#### Verification Gateway & Test Design
* **Integration Test (`SecurePlayback.test.ts`):** Verify that the component does not render the `<audio>` element until the pre-signed URL is successfully fetched, and triggers a retry on HTTP 403.

---

## Section C: Verification & Validation Acceptance Matrix

| Verification Subsystem | Quantitative Target Metric | Test Harness / Verification Command |
| :--- | :--- | :--- |
| **Frontend Type Safety** | 0 TypeScript Errors | `npm run type-check` / `npx tsc --noEmit` |
| **Test Coverage** | $\ge 90\%$ API Layer Branch Coverage | `npm run test:coverage` |
| **Network Mocks** | 100% of external requests mocked | Jest/MSW isolation check |

---

## Section D: Execution Audit History Log

| Timestamp (ISO-8601) | Milestone / Subtask ID | Execution Status | Test Result / Metric Summary | Logged By |
| :--- | :--- | :--- | :--- | :--- |
| `2026-08-16T11:45:00+05:30` | `Milestone 5.0` | **COMPLETED** (Commit: `af39f7f`) | Phase 5 Integration Development Plan authored | Antigravity AI |
| `2026-08-16T11:51:00+05:30` | `Milestone 5.1` | **COMPLETED** (Commit: `[PENDING]`) | Passed `ApiClient.test.ts` (9/9 pass, 160/160 total), TypeScript 0 errors, Next.js clean build | Antigravity AI |
| `[PENDING]` | `Milestone 5.2` | **NOT STARTED** | N/A | N/A |
| `[PENDING]` | `Milestone 5.3` | **NOT STARTED** | N/A | N/A |
| `[PENDING]` | `Milestone 5.4` | **NOT STARTED** | N/A | N/A |
