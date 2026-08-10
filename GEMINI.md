# EchoSync AI Development Protocol & Agent Rules

These rules are permanently injected into the context of every Antigravity AI session working in this repository.

## Core Implementation Workflow
Whenever a feature or implementation from any phase/milestone of the project plan is executed, YOU MUST strictly follow this sequence:

1. **Implement**: Write the code as specified in the milestone documentation.
2. **Verify, Validate & Test**: 
   - Execute the precise Verification Gateway or test instructions provided in the phase/sub-phase plan file.
   - If no specific test instructions are provided in the plan, YOU MUST ask the user for permission to analyze the implementation and relevant project files to generate new test cases/files. 
   - Do not assume tests pass without running them. You must verify the output.
3. **Clean & Isolate**: 
   - Before any git operation, completely scrub the repository of unnecessary, duplicate, and vulnerable files (e.g., stray `__pycache__` folders, duplicate `.pytest_cache` folders outside of `backend/`, `.DS_Store`, dummy testing scripts, and sensitive `.env` data).
   - Ensure `.gitignore` is successfully isolating all sensitive variables and caches.
4. **Commit & Push**: 
   - ONLY IF the implementation successfully passes all verification tests and the directory is properly cleaned, stage and commit the code.
   - Use proper, clean, and professional commit headings and messages (e.g., `feat: Implement Milestone X.X ...`).
   - Push the implementation to the GitHub repository.
5. **Track Progress**: Update the relevant Markdown planning files (e.g., `PHASE_2_DEVELOPMENT_PLAN.md`) by checking off completed tasks and appending the exact Git commit hash to the status logs.

## Phase Plan Generation & Test Design Guidelines
Whenever generating, drafting, or updating Phase Development Plans or Milestone specifications, YOU MUST adhere to the following rules:

1. **Structured & Professional Test Design**:
   - Every feature or implementation milestone in the phase plan MUST include explicit, clean, and professionally structured test specifications (e.g., unit tests, integration tests, boundary condition checks, and API Verification Gateways).
2. **Deployment Safety & Zero Error Guarantee**:
   - Designed tests MUST be robust and deployment-safe so that automated test execution runs cleanly without breaking builds, throwing unhandled runtime errors, or failing CI/CD deployment pipelines.
   - Tests must isolate external dependencies (e.g., using mocks, stubs, or sandboxed test environments) to ensure deterministic execution without relying on live external networks, third-party APIs, or production databases during deployment.
3. **Fixture Scrubbing & Environment Isolation**:
   - Test suites must clean up temporary test artifacts, mock tokens, and database entries automatically, ensuring zero residual pollution or leaks in deployment environments.

