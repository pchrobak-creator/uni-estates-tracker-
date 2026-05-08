# Uni Estates Tracker — Claude Context

## Project
Internal mobile-first web app for Uni Estates real estate agents. PIN-based login, 3 roles (superadmin / manager / agent), Google Sheets integration for live data.

## Running the app
```bash
node server/index.js          # backend → :3001
npm run dev --prefix client   # frontend → :5173
```

## Architecture

**Backend:** Express + SQLite (`node:sqlite` — no extra deps). All routes in `server/routes/`. Auth via `x-pin` header or Bearer JWT. Google Sheets data cached in memory (5–10 min TTL).

**Frontend:** React + Vite + Tailwind. Role-based tab sets in `App.jsx`. `apiFetch` in `utils.js` auto-attaches the PIN header from `sessionStorage`.

## Roles & access
- `superadmin` (PIN 1234, 2234) — all offices, all tabs
- `manager` (PIN 3234) — own office only, extra Evaluations tab
- `agent` (PIN 1001–1006) — own data only

Defined in `server/auth.js` (`MANAGER_PINS`) and `server/config/roles.js` (`AGENTS`).

## Key files
| File | Purpose |
|------|---------|
| `server/config/offices.json` | Office sheet IDs + agent PINs/colors |
| `server/config/agentSheets.js` | Per-agent Sheets IDs (leads + revenue) |
| `server/googleSheets.js` | All Sheets API functions |
| `server/cache.js` | Simple TTL in-memory cache |
| `client/src/utils.js` | evalScore (threshold: 50 calls/week), formatPLN, apiFetch |

## Google Sheets
- Central sheet ID: `1wMUykuEbF0gjiwMgS3nOX6tyWZvaqwDMVwZaNiZFBrc` (WARUNKI BONUSÓW tab — all agents, bonus thresholds, per-agent sheet IDs)
- Per-agent leads sheet: `AGENT_SHEETS[name]` — tabs `Zapytania!A:P` and `Leady!A:P`
- Per-agent revenue sheet: `AGENT_BONUS_SHEETS[name]` — column structure TBD
- Loaded automatically at server startup if `GOOGLE_API_KEY` is set

## What uses DB vs Sheets
- **DB only:** activity entries, revenue (quarterly totals), inquiry/lead statuses
- **Sheets → DB statuses merged:** inquiries list, leads list
- **Sheets only (pending):** individual transaction details from agent commission sheets

## Pending work
1. Agent commission sheet columns unknown — `getAgentBonusSheet()` reads raw, needs mapping
2. Kraków/Katowice agents not yet added to `offices.json`
3. `GOOGLE_API_KEY` not set in `.env`
4. Quarterly planning view not built
5. Weekly email summaries not built

## Conventions
- Polish UI text throughout
- Agent colors come from `agents` prop (loaded from `/api/agents`) — never hardcode `AGENT_COLORS`
- `requireManager` middleware accepts both `manager` and `superadmin` roles
- Quarter keys: `q2-2026` format (revenue DB), `2026-Q2` format (entries DB)
