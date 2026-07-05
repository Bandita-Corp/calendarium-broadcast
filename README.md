# 🍋 Lemon Seasons

A web app for marking and visualizing named timeframes (seasons) throughout the year.

## Stack

- **Backend**: NestJS · PostgreSQL · Prisma · JWT Auth
- **Frontend**: Angular · Angular CLI

## Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Roles

| Role | Capabilities |
|------|-------------|
| `USER` | View public board, view dashboard |
| `ADMIN` | All USER abilities + create/edit/delete periods, manage users |

## API

- `POST /auth/register` — Register
- `POST /auth/login` — Login
- `GET /public/periods` — Public periods list (no auth)
- `GET /periods` — Periods list (auth required)
- `POST /periods` — Create period (admin)
- `PATCH /periods/:id` — Update period (admin)
- `DELETE /periods/:id` — Delete period (admin)
- `GET /admin/users` — List users (admin)
- `PATCH /admin/users/:id/role` — Set user role (admin)
