# Uni Estates Warsaw Tracker

Dashboard aktywności i przychodów dla zespołu agentów nieruchomości — 6 agentów, widok managera i agentów, PWA.

---

## Uruchomienie lokalne

```bash
# 1. Zainstaluj zależności
npm install
cd client && npm install && cd ..

# 2. Uruchom (backend + frontend razem)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

**PINy dostępu:**
| Osoba     | PIN  |
|-----------|------|
| Manager   | 1234 |
| Hanna     | 1001 |
| Michał    | 1002 |
| Nikolay   | 1003 |
| Grzegorz  | 1004 |
| Piotr     | 1005 |
| Mikołaj   | 1006 |

---

## Deploy na Railway.app (darmowy tier)

1. Załóż konto na [railway.app](https://railway.app)
2. Kliknij **New Project → Deploy from GitHub repo**
3. Podłącz swoje repo z tym projektem
4. Railway automatycznie wykryje `Dockerfile` i zbuduje obraz
5. W zakładce **Variables** dodaj:
   - `NODE_ENV=production`
   - `DB_PATH=/app/data/tracker.db`
6. W zakładce **Settings → Networking** kliknij **Generate Domain**
7. Gotowe — Railway automatycznie deployuje po każdym push do main

> **Uwaga:** Railway na darmowym tierze usypia projekty po 21 dniach bez aktywności. Baza SQLite jest efemeryczna — dla trwałości danych użyj Railway Volume lub zewnętrznej bazy.

---

## Deploy na Render.com (darmowy tier)

1. Załóż konto na [render.com](https://render.com)
2. **New → Web Service → Connect GitHub repo**
3. Ustaw:
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** Free
4. W **Environment Variables** dodaj:
   - `NODE_ENV=production`
   - `PORT=3001`
5. Kliknij **Create Web Service**
6. Po deploymencie Render da Ci URL (np. `https://ue-tracker.onrender.com`)

> **Uwaga:** Na darmowym tierze Render usypia serwis po 15 minutach nieaktywności (pierwsze zapytanie może trwać ~30s). Dla trwałości danych podłącz Render Disk ($1/GB/mies.) z `Mount Path: /app/data`.

---

## Jak zmienić PINy agentów

Edytuj plik `server/auth.js`:

```js
const AGENTS = [
  { name: 'Hanna', pin: '1001', color: '#1D9E75', goal: 50000 },
  // zmień pin tutaj
];
const MANAGER_PIN = '1234'; // zmień PIN managera tutaj
```

Zrestartuj serwer po zmianach.

---

## Jak zaktualizować dane przychodów kwartalnych

**Opcja 1 — przez API (manager PIN):**
```bash
curl -X POST https://TWOJ-URL/api/revenue \
  -H "Content-Type: application/json" \
  -H "x-pin: 1234" \
  -d '{"agent":"Michał","quarter":"q2-2026","prowizja":25000,"transakcje":8}'
```

**Opcja 2 — edycja seed data w `server/db.js`** (tylko przy pierwszym uruchomieniu, gdy baza jest pusta).

---

## Jak dodać nowego agenta

1. W `server/auth.js` dodaj do tablicy `AGENTS`:
```js
{ name: 'Anna', pin: '1007', color: '#AA44BB', goal: 75000 },
```

2. W `client/src/views/Revenue.jsx`, `Activity.jsx`, `Evaluations.jsx`, `Leaderboard.jsx` — kolory agentów są pobierane z API (`/api/agents`), więc kolor dodany w auth.js będzie automatycznie użyty.

3. Zrestartuj serwer.

---

## Struktura projektu

```
/
├── server/
│   ├── index.js        — Express server + auth endpoint
│   ├── db.js           — SQLite setup + dane seed
│   ├── auth.js         — konfiguracja PINów i agentów
│   └── routes/
│       ├── entries.js  — CRUD dla wpisów aktywności
│       └── revenue.js  — CRUD dla danych przychodów
├── client/
│   └── src/
│       ├── App.jsx     — główny komponent, routing
│       ├── utils.js    — helpery (tydzień, kwartał, formatowanie)
│       ├── components/ — Login, BottomNav, MetricCard, etc.
│       └── views/      — Revenue, Activity, Evaluations, LogEntry, MyStats, Leaderboard
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Tech stack

- **Frontend:** React 18, Tailwind CSS, Chart.js, Vite, PWA (manifest + service worker)
- **Backend:** Node.js, Express
- **Baza danych:** SQLite via `better-sqlite3`
- **Auth:** PIN-based (sessionStorage), middleware x-pin header
