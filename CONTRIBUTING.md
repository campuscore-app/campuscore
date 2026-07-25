# Contributing to CampusCore

Thanks for your interest in improving CampusCore. This document covers how to get set up and what to expect when opening an issue or PR.

## Before you start

- For anything beyond a small fix (new modules, schema changes, dependency upgrades), open an issue first to discuss the approach. This avoids wasted work on PRs that don't fit the project's direction.
- Check existing issues and PRs to avoid duplicate work.

## Development setup

See the [README](./README.md#manual-setup-development) for backend (.NET 8) and frontend (React/Vite) setup instructions.

## Project structure

The backend is a modular monolith — each module (`Auth`, `Students`, `Staff`, `Attendance`, `Fees`) under `api/src/CampusCore.Api/Modules/` owns its own entity, repository, manager, validators, DTOs, and controller. There's no shared generic repository; keep new repository methods specific to the query they serve rather than introducing generic abstractions.

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Keep PRs focused — one logical change per PR.
3. Make sure the backend builds (`dotnet build`) and the frontend builds/lints (`npm run build`, `npm run lint`) before submitting.
4. Describe what the change does and why in the PR description.
5. Link the related issue if one exists.

## Reporting bugs / requesting features

Use the issue templates — they ask for the information needed to reproduce a bug or evaluate a feature request.

## Code of conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful and constructive.
