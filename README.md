# Uni Estates Tracker

Internal activity and revenue tracking app for Uni Estates real estate agents across three offices (Warsaw, Kraków, Katowice).

## Status

| Area | Status |
|------|--------|
| PIN-based auth (3 roles) | ✅ Done |
| Agent views (revenue, stats, ranking, leads, inquiries) | ✅ Done |
| Manager views (revenue, activity, evaluations, leads, inquiries) | ✅ Done |
| Superadmin views (all offices, office filter) | ✅ Done |
| Google Sheets integration (leads & inquiries) | ✅ Done |
| Agent commission sheets integration | ⏳ Awaiting column structure |
| Kraków / Katowice agents (PINs, colors) | ⏳ Awaiting data |
| Google API Key configured | ⏳ Awaiting key in `.env` |
| Quarterly planning view | 🔲 Not started |
| Weekly email summaries | 🔲 Not started |

## Tech Stack

- **Backend** — Node.js, Express, SQLite (`node:sqlite`)
- **Frontend** — React 18, Vite, Tailwind CSS, Chart.js
- **Data** — Google Sheets API v4 (API Key, public sheets)

## Roles & PINs

| PIN | Name | Role | Office |
|-----|------|------|--------|
| `1234` | Piotr Chrobak | Superadmin | Warsaw |
| `2234` | Zbigniew Michalak | Superadmin | Kraków |
| `3234` | Katarzyna Trybala | Manager | Katowice |
| `1001` | Hanna | Agent | Warsaw |
| `1002` | Michał | Agent | Warsaw |
| `1003` | Nikolay | Agent | Warsaw |
| `1004` | Grzegorz | Agent | Warsaw |
| `1005` | Piotr Z. | Agent | Warsaw |
| `1006` | Mikołaj | Agent | Warsaw |

## Setup

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# → add GOOGLE_API_KEY to .env

# Run (development)
node server/index.js          # backend  → localhost:3001
npm run dev --prefix client   # frontend → localhost:5173
```

## Google Sheets Configuration

Three types of sheets are used:

| Sheet | ID | Purpose |
|-------|----|---------|
| Central (WARUNKI BONUSÓW) | `1wMUykuEbF0gjiwMgS3nOX6tyWZvaqwDMVwZaNiZFBrc` | All agents, bonus thresholds, per-agent sheet IDs |
| Warsaw revenue | `1AWcZ8EUJPeDHaTppKbIy0X3izCbXWp1WHxBCRl4qV1k` | Office-level revenue |
| Kraków revenue | `1zMf4XBr-wSZtBj1FYOBIwsBcwK6VtHMyMi2cUUI8hnk` | Office-level revenue |
| Katowice revenue | `11TqcFTEgpxlxQ7r-TUyVR6xd9mbj-ooYC7wu3N2LEeo` | Office-level revenue |

Per-agent sheet IDs (`Plik Prowizje-Bonusy` and `Plik Leady-Zapytania`) are loaded automatically from the central sheet at server startup.

All sheets must be set to **public (anyone with the link can view)**.

## Project Structure

```
├── server/
│   ├── index.js              # Express server + startup agent sync
│   ├── auth.js               # PIN validation, role middleware
│   ├── db.js                 # SQLite schema + seed data
│   ├── googleSheets.js       # Sheets API functions + TTL cache
│   ├── cache.js              # In-memory TTL cache
│   ├── config/
│   │   ├── offices.json      # Office config (sheet IDs, agents, PINs)
│   │   ├── roles.js          # Agent list, manager map
│   │   └── agentSheets.js    # Per-agent sheet ID maps
│   └── routes/
│       ├── entries.js        # Activity entries (calls, meetings, acquisitions)
│       ├── revenue.js        # Revenue (DB + agent Sheets)
│       ├── inquiries.js      # Inquiries (Sheets data + DB statuses)
│       └── leads.js          # Leads (Sheets data + DB statuses)
└── client/src/
    ├── App.jsx               # Role-based routing
    ├── utils.js              # Helpers, evaluation scoring, apiFetch
    ├── components/           # Login, BottomNav, MetricCard, ProgressBar...
    └── views/
        ├── Revenue.jsx       # Team revenue (manager/superadmin)
        ├── Activity.jsx      # Team activity
        ├── Evaluations.jsx   # Agent evaluations (manager)
        ├── ManagerInquiries.jsx
        ├── ManagerLeads.jsx
        ├── MyRevenue.jsx     # Personal revenue (agent)
        ├── MyStats.jsx       # Personal activity stats (agent)
        ├── Leaderboard.jsx   # Team ranking (agent)
        ├── Inquiries.jsx     # My inquiries (agent)
        ├── Leads.jsx         # My leads (agent)
        └── LogEntry.jsx      # Log activity entry
```

## Next Steps

1. Add `GOOGLE_API_KEY` to `.env`
2. Share column headers from `Plik Prowizje-Bonusy` agent sheets → wire up real revenue data
3. Add Kraków and Katowice agents to `server/config/offices.json`
4. Build quarterly planning view
