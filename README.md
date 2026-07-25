# CampusCore — Open Source School Management System (School ERP)

**Open-source school management system.** Free to self-host forever. Premium modules and a managed cloud option are planned for schools that don't want to run their own server — not yet available.

[campuscore.dev](https://campuscore.dev) · Licensed under [AGPL-3.0](./LICENSE)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![.NET 8](https://img.shields.io/badge/.NET-8-512BD4)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)

## Why this exists

Most school ERP software in India is either expensive, closed-source, or both — schools pay recurring fees for basic record-keeping and have no visibility into how their data is handled. CampusCore's core modules are free and open source: any school (or developer) can self-host it, read the code, and modify it. Premium modules and a hosted version are planned for schools that want more than the core, or don't want to manage a server themselves, once the core is stable — that's the intended path to funding ongoing development.

## What's included (free & open source)

| Module | What it does |
|---|---|
| **Auth** | First-run setup wizard creates the admin account on first launch — no shared default password ships with the product. JWT-based login. |
| **Students** | Enrollment records — roll number, class, section, guardian and contact details. |
| **Staff** | Staff directory — role, department, contact, joining date. |
| **Attendance** | Mark a whole class in one go ("Take Attendance"), or correct a single student's entry. Same-day edit lock keeps attendance history honest. |
| **Fees (Basic)** | Assign fees per student, record payments against them, auditable payment history with receipt numbers. Prevents overpayment automatically. |

Premium modules (timetable, exams & report cards, communications, transport) and a managed cloud-hosted option are planned to be built on top of this same codebase, but don't exist yet — this repository is the core, free product.

## Tech stack

- **Backend:** .NET 8, PostgreSQL (via Npgsql/EF Core), JWT auth, FluentValidation
- **Frontend:** React 19, TypeScript, Vite
- **Deployment:** Docker + Docker Compose

## Quick start (Docker)

The fastest way to run CampusCore is with Docker Compose — it starts Postgres, the API, and the web app together.

```bash
git clone https://github.com/<your-org>/campuscore.git
cd campuscore
cp .env.example .env
# edit .env — at minimum set POSTGRES_PASSWORD and JWT_SIGNING_KEY
docker compose up -d
```

Then open **http://localhost:5173**. Since no admin account is seeded by default, you'll land on a first-run setup screen to create one.

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:5073 |
| API docs (Swagger, dev only) | http://localhost:5073/swagger |

To stop everything: `docker compose down` (add `-v` to also delete the database volume).

## Manual setup (development)

For active development, running the API and frontend directly (outside Docker) gives faster reload cycles.

### Backend

Requires the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) and a running PostgreSQL instance.

```bash
cd api/src/CampusCore.Api
# Set your connection string in appsettings.Development.json (ConnectionStrings:Default)
dotnet run
```

Migrations run automatically on startup, so there's no separate `dotnet ef database update` step. The API starts on `http://localhost:5073` by default.

### Frontend

Requires Node 20+.

```bash
cd web
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your API runs elsewhere
npm run dev
```

The web app starts on `http://localhost:5173` by default.

## Project structure

```
campuscore/
├── api/    .NET 8 backend — one project, organized by feature module
│   └── src/CampusCore.Api/Modules/  (Auth, Students, Staff, Attendance, Fees)
├── web/    React + TypeScript frontend
└── docker-compose.yml
```

The backend is a modular monolith: each module owns its own entity, repository, manager, validators, DTOs, and controller. There's no shared generic repository — every repository method is specific and purposeful to how that module actually queries its data.

## License

CampusCore is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0) — see [LICENSE](./LICENSE).

In short: you're free to self-host, use, and modify this software, including for a school you run commercially. If you modify it and offer that modified version to others over a network (e.g. as a hosted service), you must make your modified source available to those users under the same license. This is what keeps the free tier free and open for everyone, including competitors.

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss significant changes before submitting a PR.
