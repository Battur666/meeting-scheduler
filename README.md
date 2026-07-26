# Meeting Scheduler (Toki mini app, no video/audio calls)

A room + time booking tool modeled on Outlook's Scheduling Assistant — free/busy
grid, required/optional attendees, room picker, suggested times. No call links.
Runs as a **Toki mini program**: only phone numbers present in the uploaded
employee roster can get in.

## Structure
```
meeting-scheduler/
├── backend/     Express API (auth, admin, rooms, attendees, availability, meetings)
│   ├── server.js
│   ├── lib/auth.js       ← JWT sign/verify + requireEmployee/requireAdmin
│   ├── routes/
│   ├── .env               ← TOKI_BASE_URL, TOKI_API_KEY, JWT_SECRET, ADMIN_PASSWORD (not committed)
│   └── data/db.json      ← simple JSON "database" via lowdb
└── frontend/    React + Vite app
    └── src/
        ├── App.jsx        ← auth gate + scheduler
        ├── AccessDenied.jsx
        ├── AdminPanel.jsx ← /admin — password-protected xlsx roster upload
        ├── auth.js
        └── styles.css
```

## Run it locally

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in TOKI_API_KEY, JWT_SECRET, ADMIN_PASSWORD
npm run dev
```
Runs on http://localhost:4000. Health check: http://localhost:4000/api/health

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 and proxies `/api/*` to the backend.

## Getting employees into the app
1. Open http://localhost:5173/admin, log in with `ADMIN_PASSWORD`.
2. Upload the employee xlsx (columns: `lastname, firstname, employeephone,
   departmentname, name, companyname`). This replaces the employee roster
   and regenerates the meeting-attendee list from it.

## Auth flow
Toki opens the mini program at `?tokenid={token}`. The frontend exchanges
that token via `POST /api/auth/toki`, which calls Toki's
`third-party-service/v1/shoppy/user` endpoint to get the caller's phone
number and checks it against the uploaded roster. A match issues a 12h
session JWT; everything else (attendees/rooms/meetings/availability) requires
that JWT via `Authorization: Bearer`.

Since the real Toki token flow can only be exercised inside Toki's app,
there's a **local dev bypass**: outside `NODE_ENV=production`, visiting
`http://localhost:5173/?devPhone=<a phone from the roster>` simulates that
user without calling Toki at all.

## API summary
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/toki` | public | exchange a Toki token (or `devPhone`) for a session |
| POST | `/api/admin/login` | public | admin password → admin session |
| POST | `/api/admin/employees/upload` | admin | replace roster from xlsx, regenerate attendees |
| GET | `/api/admin/employees` | admin | list current roster |
| GET | `/api/attendees` | employee | list people who can be invited |
| GET | `/api/rooms` | employee | list bookable rooms (just "Toki Zadgai") |
| GET | `/api/availability?date=&attendeeIds=&roomId=&durationMinutes=` | employee | free/busy grid + suggested times |
| GET | `/api/meetings` | employee | list booked meetings |
| POST | `/api/meetings` | employee | book a meeting (409 if a conflict is found) |

## Data model notes
- `busyBlocks` holds free/busy/tentative/out-of-office blocks for both
  **attendees** and **rooms** — booking a meeting adds new `busy` blocks so the
  grid stays accurate.
- `meetings` always has `hasCallLink: false` — there's no field anywhere for a
  video/audio URL, by design.
- Swap `lowdb` (JSON file) for Postgres/SQLite/Mongo later without touching
  the route logic much — the query patterns are already isolated in
  `routes/*.js`.

## Migrating this into Claude Code
1. Unzip this project somewhere permanent, e.g. `~/projects/meeting-scheduler`.
2. Open that folder in VS Code (`code ~/projects/meeting-scheduler`).
3. Open the Claude Code panel and just point it at the folder — it reads
   files directly, no import step needed.
4. Good first prompts to hand Claude Code:
   - "Read through this repo and summarize the architecture."
   - "Add a SQLite database instead of the JSON file, keep the same routes."
   - "Add authentication so only logged-in users can book meetings."
   - "Add a day/week view toggle to the availability grid."
   - "Write tests for the meeting conflict-checking logic in routes/meetings.js."
5. Since both the frontend and backend are plain Node projects, Claude Code
   can run `npm install`, `npm run dev`, and read terminal output directly —
   no special setup needed beyond having Node.js installed.

## Known simplifications (good next steps)
- The `xlsx` npm package has an unpatched high-severity advisory (prototype
  pollution / ReDoS) — acceptable here since only the password-protected
  admin uploads files, but worth revisiting if that changes.
- Real Toki `tokenid` verification hasn't been exercised outside the dev
  bypass — confirm it once this is deployed inside Toki's mini-program sandbox.
- Working hours are hardcoded to 9am–5pm.
- Suggested times treat everyone passed in as "required" for conflict
  purposes; the Required/Optional toggle in the UI is currently cosmetic —
  a good first Claude Code task is wiring it into the availability scoring.
- No recurring meetings yet.
