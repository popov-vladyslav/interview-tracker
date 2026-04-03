# Interview Tracker

A cross-platform app to track job interviews, stages, contacts, and notes. Built with Expo (React Native) for mobile and web, with a Node.js/Express backend and Neon Postgres database.

## Preview by Expo go or Website
** Note: The backend is hosted on free services, so it may go down during inactivity and take some time to start up again (cold start). **

<img width="251" height="252" alt="Screenshot 2026-04-03 at 15 52 51" src="https://github.com/user-attachments/assets/ebbef3de-a663-4499-842b-c22eff39814d" />

[Visit my website](https://interview-tracker-web.onrender.com) 


## Features

- **Dashboard** with search, status filtering, and stage grouping
- **Web Kanban board** with drag-and-drop between status columns (Wishlist, Active, Offer, Rejected)
- **Interview stages** per company (HR Review, Technical, Client + custom stages)
- **Contacts & notes** management per company
- **Authentication** with JWT (email/password)
- **Account deletion** with full data cascade
- Pull-to-refresh, skeleton loaders, Snackbar error feedback
- Haptic feedback on iOS, smooth animations via Reanimated

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile & Web | Expo 54, React Native 0.81, React 19 |
| Routing | Expo Router 6 (file-based) |
| UI | React Native Paper 5.15 (Material Design 3) |
| State | Zustand 5 |
| Animations | react-native-reanimated 4.x |
| Web Kanban | Expo DOM Components + @hello-pangea/dnd |
| Backend | Node.js, Express |
| Database | Neon Postgres |
| Auth | JWT (bcrypt + expo-secure-store) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon Postgres database (or any PostgreSQL instance)

### Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```
DATABASE_URL=postgres://user:pass@host/dbname?sslmode=require
JWT_SECRET=your-secret-key
```

Run the database migration:

```bash
node src/db/migrate.js
```

If upgrading from an older version, run the v2 migration:

```bash
node src/db/migrate-v2.js
```

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
npm install
```

Start the Expo dev server:

```bash
npx expo start
```

- Press `w` for web
- Press `i` for iOS simulator
- Press `a` for Android emulator

## Project Structure

```
app/                    # Expo Router screens
  (auth)/               # Login, Register
  (tabs)/               # Dashboard, Settings
  company/              # Detail, Add, Edit
components/             # Shared components (Kanban board)
features/
  auth/                 # Auth store
  common/               # Shared UI (EmptyState, DatePicker)
  companies/            # Companies store, CompanyCard, CompanyForm, StatsBar, etc.
services/               # API clients, types
theme/                  # Colors, spacing, Paper theme
utils/                  # Haptics helpers
server/
  src/
    db/                 # Connection, migrations
    routes/             # Express routes (auth, companies, stages, contacts, notes)
    middleware/         # JWT auth middleware
ai/                     # AI-generated specs (PRD, tasks, UI, tests)
```

## Data Model

### Statuses

`Wishlist` | `Active` | `Offer` | `Rejected`

### Default Stages (per company)

`HR Review` | `Technical` | `Client` (custom stages can be added)

### Database Tables

- **companies** — name, role, status, stage, work_mode, location, salary, source, tags, rating, dates
- **stages** — per-company interview stages with status, date, interviewer, feedback, notes
- **contacts** — per-company recruiter/interviewer contacts
- **notes** — per-company notes (general, feedback, transcription, prep)
