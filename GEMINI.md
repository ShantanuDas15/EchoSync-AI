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
