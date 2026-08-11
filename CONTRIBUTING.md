# Contributing to EchoSync AI

First off, thank you for considering contributing to EchoSync AI! We appreciate community involvement.

## Development Workflow
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Follow the strict architectural guidelines outlined in the `docs/` folder (Phase Plans and Tech Stack).
4. Make your changes.
5. Run the verification gateway (Pytest, flake8, mypy): `pytest backend/tests --cov=app --cov-fail-under=80`.
6. Commit your changes with clear semantic tags (`feat:`, `fix:`, `docs:`).
7. Push to your branch and open a Pull Request.

## Code Standards
- **Python**: PEP 8 compliance enforced by Flake8 and type hinting via MyPy.
- **TypeScript**: Next.js 14 App Router standards. Strict typing required.
- **Docker**: Always utilize multi-stage builds to respect the 512MB RAM constraints of our deployment environments.

Please refer to the `README.md` for local setup instructions via Docker Compose.
