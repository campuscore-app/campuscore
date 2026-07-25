# CampusCore — Open Source School Management System (School ERP)

**Open-source school management system.** Free to self-host forever. Premium modules and a managed cloud option are planned for schools that don't want to run their own server — not yet available.

Built for schools, colleges, and educational institutions looking for a modern, self-hosted ERP.

[campuscore.dev](https://campuscore.dev) · Licensed under [AGPL-3.0](./LICENSE) · Live demo & docs: coming soon

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![.NET 8](https://img.shields.io/badge/.NET-8-512BD4)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red.svg)](./LICENSE)

## Why this exists

Many school ERP solutions are expensive, closed-source, or both — schools pay recurring fees for basic record-keeping and have no visibility into how their data is handled. CampusCore's core modules are free and open source: any school (or developer) can self-host it, read the code, and modify it. Premium modules and a hosted version are planned for schools that want more than the core, or don't want to manage a server themselves, once the core is stable — that's the intended path to funding ongoing development.

## CampusCore vs. typical school ERP

| | CampusCore | Typical School ERP |
|---|---|---|
| Self-hosting | ✅ Yes | ❌ Usually not offered |
| Source code | ✅ Open (AGPL-3.0) | ❌ Closed |
| Core functionality | ✅ Free | ❌ Subscription required |
| Contributions | ✅ Open to the community | ❌ Vendor-only roadmap |
| Data ownership | ✅ Stays on your server | ❌ Vendor's servers |

## What's included (free & open source)

| Module | What it does |
|---|---|
| **Auth** | First-run setup wizard creates the admin account on first launch — no shared default password ships with the product. JWT-based login. |
| **Students** | Enrollment records — roll number, class, section, guardian and contact details. |
| **Staff** | Staff directory — role, department, contact, joining date. |
| **Attendance** | Mark a whole class in one go ("Take Attendance"), or correct a single student's entry. Same-day edit lock keeps attendance history honest. |
| **Fees (Basic)** | Assign fees per student, record payments against them, auditable payment history with receipt numbers. Prevents overpayment automatically. |

Premium modules (timetable, exams & report cards, communications, transport) and a managed cloud-hosted option are planned to be built on top of this same codebase, but don't exist yet — this repository is the core, free product.

## Roadmap

- ✅ Authentication
- ✅ Students
- ✅ Staff
- ✅ Attendance
- ✅ Fees (Basic)
- 🚧 Timetable
- 🚧 Exams & Report Cards
- 🚧 Parent Portal
- 🚧 SMS Notifications
- 🚧 Email Notifications
- 🚧 CampusCore Cloud (managed hosting)

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

## Why AGPL?

Most permissive licenses (MIT, Apache) let a company take the code, host it as a paid service, and never contribute anything back. AGPL-3.0 closes that gap: if you modify CampusCore and offer it to others over a network — e.g. as a competing hosted product — you must publish your modified source under the same license. Running it privately for your own school has no such obligation. In short: **AGPL ensures improvements to a hosted version stay open source when redistributed as a network service.**

## License

CampusCore is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0) — see [LICENSE](./LICENSE).

In short: you're free to self-host, use, and modify this software, including for a school you run commercially. If you modify it and offer that modified version to others over a network (e.g. as a hosted service), you must make your modified source available to those users under the same license. This is what keeps the free tier free and open for everyone, including competitors.

## Business model

CampusCore follows the open-core model used by projects like GitLab, Sentry, and Supabase:

```
Open-source core (this repo)
        ↓
Schools self-host for free
        ↓
Need advanced features?
        ↓
Buy premium modules  —or—  use CampusCore Cloud (managed hosting)
```

The core stays free and open forever. Premium modules and managed hosting (see [Roadmap](#roadmap)) are what fund ongoing development — they don't gate anything in the free core.

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss significant changes before submitting a PR.
