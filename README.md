# PresenceBoard

PresenceBoard is a full-stack attendance app for classes, workshops, labs, and small team sessions. An organizer can create groups and events, share a QR code or short access code, and let participants check in from their own phone without creating an account.

I built it around a simple idea: attendance should be quick to open, easy to share, and clear enough that nobody has to chase a spreadsheet afterward.

Live app: https://presenceboard-attendance.onrender.com

## What It Does

- Organizer accounts with JWT authentication.
- Private event groups owned by the signed-in organizer.
- Editable group names and descriptions.
- Manual event creation plus weekly, biweekly, or monthly recurring event generation.
- Group-local event numbering, such as `BD #1`, `BD #2`, then `SGBD #1`.
- Unique access codes for every event.
- Participant check-in by QR code or manual code entry.
- Duplicate check-in protection per event and participant email.
- Live attendance view for organizers.
- CSV export for a single event.
- A small homepage quote widget powered by the DummyJSON Quotes API, with a local fallback if the external API is unavailable.
- SQLite for local development and PostgreSQL support for deployed environments.

## Tech Stack

- React 19 and Vite for the frontend.
- Express 5 for the API.
- Sequelize for the data layer.
- SQLite locally.
- PostgreSQL in production through `DATABASE_URL`.
- JWT and bcrypt for authentication.
- `qrcode.react` for QR code generation.
- `html5-qrcode` for scanning QR codes from the browser.

## Project Structure

```text
backend/
  app.js
  server.js
  config/
  controllers/
  middleware/
  models/
  routes/
  scripts/
  services/
  utils/
docs/
  presenceboard-erd.png
frontend/
  index.html
  src/
render.yaml
package.json
```

The backend lives under `backend/` so the API, models, routes, services, and configuration stay in one predictable place.

## Product Flow

1. Create an organizer account or sign in.
2. Create an event group, such as `Web Technologies - Group C`.
3. Add one event manually, or generate recurring events from a date range.
4. Open an event's attendance screen and share the QR code or participant link.
5. Participants enter their name and email, then confirm attendance.
6. The organizer sees the attendance list and can export it as CSV.

## Local Setup

```bash
npm install
cp .env.example .env
npm run build
npm start
```

The app will run at:

```text
http://localhost:3000
```

Keep that terminal open while using the local app.

For frontend-only development with Vite:

```bash
npm run dev:client
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so keep the backend running in another terminal with:

```bash
npm run dev
```

## Environment Variables

```text
PORT=3000
DB_NAME=presence.sqlite
JWT_SECRET=replace-this-with-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
QUOTE_API_URL=https://dummyjson.com/quotes/random

# Production PostgreSQL, normally provided by the host:
DATABASE_URL=postgres://user:password@host:5432/database
DB_SSL=false
```

If `DATABASE_URL` is present, the app uses PostgreSQL. Otherwise, it falls back to SQLite, which keeps local setup light and fast.

## Quality Checks

```bash
npm run lint
npm run smoke
```

The smoke test creates a temporary SQLite database and walks through the main flow:

```text
register -> login -> group -> event -> participant check-in -> CSV export
```

## Deployment

The project is ready to deploy on Render with the included Blueprint. `render.yaml` creates a Node web service, creates a managed PostgreSQL database, connects the service through `DATABASE_URL`, configures the `/api/health` health check, and generates `JWT_SECRET` automatically.

The Render flow is:

1. Push the repository to GitHub.
2. Create a new Render Blueprint from the repo.
3. Let Render read `render.yaml`.
4. Deploy the generated web service and database.

The app can also run on any Node host that supports:

```bash
npm ci --include=dev
npm run build
npm start
```

On Render's free plan, the first request after inactivity can take a little longer while the service wakes up.

## API Snapshot

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/quotes/random` | Random quote displayed on the homepage |
| `POST` | `/api/organizers/register` | Create organizer account |
| `POST` | `/api/organizers/login` | Sign in and receive JWT |
| `GET` | `/api/event-groups` | List the current organizer's groups |
| `POST` | `/api/event-groups` | Create an event group |
| `POST` | `/api/events` | Create an event inside a group |
| `POST` | `/api/attendance` | Public participant check-in |
| `GET` | `/api/attendance/events/:id` | Organizer attendance view |
| `GET` | `/api/attendance/export/:id` | CSV export |

## Database

The project includes an English ERD here:

![PresenceBoard ERD](docs/presenceboard-erd.png)

The main entities are organizers, event groups, events, and attendance records. Event sequence numbers are unique inside each event group, and attendance records are unique by event and participant email. That keeps generated sessions easy to read and prevents duplicate submissions from creating repeated rows.

## Trying It Out

For a quick manual test, create an event whose start time is a few minutes in the past and whose end time is later today. That keeps the event open, so participant check-in works immediately.

The code intentionally keeps the domain model small: authentication, ownership checks, recurring event generation, QR-based check-in, and CSV export are all visible without needing a large seed database.
