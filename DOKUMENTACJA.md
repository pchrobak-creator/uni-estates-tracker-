# Uni Estates Tracker — Dokumentacja techniczna

## Spis treści
1. [Przegląd aplikacji](#1-przegląd-aplikacji)
2. [Stos technologiczny](#2-stos-technologiczny)
3. [Struktura plików](#3-struktura-plików)
4. [Konfiguracja i uruchomienie](#4-konfiguracja-i-uruchomienie)
5. [System autoryzacji — PIN i role](#5-system-autoryzacji--pin-i-role)
6. [Baza danych](#6-baza-danych)
7. [Integracja z Google Sheets](#7-integracja-z-google-sheets)
8. [Backend — API endpointy](#8-backend--api-endpointy)
9. [Frontend — widoki według roli](#9-frontend--widoki-według-roli)
10. [Komponenty współdzielone](#10-komponenty-współdzielone)
11. [Stan do zrobienia (TODO)](#11-stan-do-zrobienia-todo)

---

## 1. Przegląd aplikacji

**Uni Estates Tracker** to wewnętrzna aplikacja mobilna dla agentów nieruchomości sieci Uni Estates. Umożliwia śledzenie aktywności (telefony, spotkania, pozyski), przychodów z prowizji oraz zarządzanie zapytaniami i leadami.

Obsługuje **3 oddziały**: Warszawa, Kraków, Katowice.

Dostęp do aplikacji odbywa się przez **4-cyfrowy PIN** bezpośrednio w przeglądarce mobilnej — bez logowania przez e-mail/hasło.

---

## 2. Stos technologiczny

### Backend
- **Node.js** z Express.js
- **SQLite** przez wbudowany moduł `node:sqlite` (DatabaseSync) — bez dodatkowych bibliotek
- **JWT** (`jsonwebtoken`) — opcjonalnie do tokenów sesji
- **Google Sheets API v4** przez `googleapis` — odczyt danych z publicznych arkuszy

### Frontend
- **React 18** z Vite
- **Tailwind CSS** — stylowanie
- **Chart.js** + `react-chartjs-2` — wykresy

### Hosting / środowisko
- Aplikacja uruchamiana lokalnie lub na serwerze VPS
- Baza danych SQLite przechowywana w pliku `data/tracker.db`
- Zmienne środowiskowe w pliku `.env`

---

## 3. Struktura plików

```
uni-estates-tracker/
├── .env                          # Zmienne środowiskowe (API key, JWT secret)
├── package.json
├── data/
│   └── tracker.db                # Baza SQLite (tworzy się automatycznie)
├── server/
│   ├── index.js                  # Główny plik serwera Express
│   ├── auth.js                   # Logika autoryzacji (PIN + JWT middleware)
│   ├── db.js                     # Połączenie z SQLite + schema + seed data
│   ├── cache.js                  # Prosty cache TTL w pamięci (dla Sheets)
│   ├── googleSheets.js           # Funkcje do odczytu Google Sheets
│   ├── config/
│   │   ├── offices.json          # Konfiguracja oddziałów (ID arkuszy, agenci, PINy)
│   │   ├── roles.js              # Lista agentów, mapowanie email→rola
│   │   └── agentSheets.js        # ID arkuszy Sheets per agent (leady + prowizje)
│   └── routes/
│       ├── auth.js               # (Google OAuth — na przyszłość, nieużywane)
│       ├── entries.js            # CRUD dla wpisów aktywności (telefony, spotkania)
│       ├── revenue.js            # Przychody z DB + przychody agenta z Sheets
│       ├── inquiries.js          # Zapytania (statusy w DB, dane z Sheets)
│       └── leads.js              # Leady (statusy w DB, dane z Sheets)
└── client/
    ├── vite.config.js            # Proxy /api → localhost:3001
    ├── index.html
    └── src/
        ├── App.jsx               # Routing, autoryzacja, tabs per rola
        ├── utils.js              # Helpery (formatowanie, kalkulacje, apiFetch)
        ├── components/
        │   ├── Login.jsx         # Klawiatura PIN (4 cyfry)
        │   ├── BottomNav.jsx     # Dolna nawigacja (mobile)
        │   ├── MetricCard.jsx    # Kafelek z metryką
        │   ├── ProgressBar.jsx   # Pasek postępu
        │   ├── AgentAvatar.jsx   # Awatar agenta (inicjały + kolor)
        │   └── Toast.jsx         # Powiadomienie (success/error)
        └── views/
            ├── Revenue.jsx       # Przychody oddziału (manager/superadmin)
            ├── Activity.jsx      # Aktywność zespołu (manager/superadmin)
            ├── Evaluations.jsx   # Oceny agentów (tylko manager)
            ├── ManagerInquiries.jsx  # Zapytania — widok managera
            ├── ManagerLeads.jsx      # Leady — widok managera
            ├── LogEntry.jsx      # Formularz wpisu aktywności
            ├── MyRevenue.jsx     # Moje przychody (agent)
            ├── MyStats.jsx       # Moje wyniki / aktywność (agent)
            ├── Leaderboard.jsx   # Ranking zespołu (agent)
            ├── Inquiries.jsx     # Moje zapytania (agent)
            └── Leads.jsx         # Moje leady (agent)
```

---

## 4. Konfiguracja i uruchomienie

### Plik `.env`
```
GOOGLE_API_KEY=twój_klucz_api_google
JWT_SECRET=losowy_ciąg_znaków_do_tokenów
PORT=3001
CLIENT_URL=http://localhost:5173
```

> **WAŻNE:** Arkusze Google muszą być ustawione jako **publiczne** (dostępne dla wszystkich z linkiem), bo aplikacja używa API Key (nie Service Account).

### Jak uzyskać Google API Key
1. Wejdź na [console.cloud.google.com](https://console.cloud.google.com)
2. Utwórz projekt → włącz **Google Sheets API**
3. Credentials → Create Credentials → **API Key**
4. Wklej klucz do `.env` jako `GOOGLE_API_KEY=...`

### Uruchomienie
```bash
npm install          # instalacja zależności backendu
cd client && npm install   # instalacja zależności frontendu
cd ..

# Development (dwa terminale)
node server/index.js        # backend na porcie 3001
cd client && npm run dev    # frontend na porcie 5173

# Produkcja
cd client && npm run build  # buduje do client/dist/
NODE_ENV=production node server/index.js  # serwuje frontend + API
```

---

## 5. System autoryzacji — PIN i role

### Jak działa logowanie
1. Użytkownik wpisuje 4-cyfrowy PIN na ekranie logowania
2. Frontend wysyła `POST /api/auth` z `{ pin: "1234" }`
3. Serwer weryfikuje PIN i zwraca obiekt użytkownika
4. Frontend zapisuje PIN i dane użytkownika w `sessionStorage`
5. Każde kolejne żądanie do API dołącza `x-pin` w nagłówku HTTP

### Zdefiniowane PINy

#### Superadmin
| PIN | Imię i nazwisko | Oddział | E-mail |
|-----|----------------|---------|--------|
| `1234` | Piotr Chrobak | Warszawa | p.chrobak@uniestates.pl |
| `2234` | Zbigniew Michalak | Kraków | z.michalak@uniestates.pl |

#### Manager
| PIN | Imię i nazwisko | Oddział | E-mail |
|-----|----------------|---------|--------|
| `3234` | Katarzyna Trybala | Katowice | k.trybala@uniestates.pl |

#### Agenci — Warszawa
| PIN | Imię | Kolor | E-mail |
|-----|------|-------|--------|
| `1001` | Hanna | `#1D9E75` (zielony) | h.raj@uniestates.pl |
| `1002` | Michał | `#378ADD` (niebieski) | m.filip@uniestates.pl |
| `1003` | Nikolay | `#D85A30` (pomarańczowy) | n.hadzhikostov@uniestates.pl |
| `1004` | Grzegorz | `#7F77DD` (fioletowy) | g.jakubik@uniestates.pl |
| `1005` | Piotr | `#BA7517` (złoty) | p.zajkowski@uniestates.pl |
| `1006` | Mikołaj | `#D4537E` (różowy) | m.sporek@uniestates.pl |

> Agenci z Krakowa i Katowic będą dodani po uzupełnieniu danych w `server/config/offices.json`.

### Role i uprawnienia

| Rola | Co widzi | Dostęp API |
|------|----------|------------|
| `superadmin` | Wszystkie oddziały, wszystkie zakładki | Wszystko |
| `manager` | Tylko swój oddział, bez zakładki Oceny globalnie | `requireManager` |
| `agent` | Tylko swoje dane | `requireAuth` z walidacją `req.user.name` |

### Pliki odpowiedzialne
- `server/auth.js` — `validatePin()`, `requireAuth()`, `requireManager()`, `requireSuperAdmin()`
- `server/config/roles.js` — tablica `AGENTS`, mapa `MANAGER_MAP`, lista `SUPER_ADMIN_EMAILS`
- `server/config/offices.json` — pełna lista agentów per oddział z pinami i kolorami

---

## 6. Baza danych

Baza SQLite w `data/tracker.db`. Tworzy się automatycznie przy pierwszym uruchomieniu serwera.

### Tabela: `entries` — wpisy aktywności
```sql
CREATE TABLE entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agent      TEXT NOT NULL,          -- nazwa agenta
  calls      INTEGER DEFAULT 0,      -- telefony wychodzące
  scheduled  INTEGER DEFAULT 0,      -- umówione spotkania
  done       INTEGER DEFAULT 0,      -- spotkania które się odbyły
  pozyski    INTEGER DEFAULT 0,      -- pozyski (pozyskane nieruchomości)
  week       TEXT NOT NULL,          -- klucz tygodnia, np. "2026-W17"
  quarter    TEXT NOT NULL,          -- klucz kwartału, np. "2026-Q2"
  date       TEXT NOT NULL,          -- data ISO wpisu
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: `revenue` — przychody z prowizji
```sql
CREATE TABLE revenue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agent       TEXT NOT NULL,
  quarter     TEXT NOT NULL,          -- np. "q2-2026"
  prowizja    REAL DEFAULT 0,         -- łączna prowizja w PLN
  transakcje  INTEGER DEFAULT 0,      -- liczba transakcji
  UNIQUE(agent, quarter)              -- jeden wpis per agent per kwartał
);
```

> **Docelowo:** ta tabela będzie zastąpiona danymi z Google Sheets (arkusze prowizji per agent). Na razie dane wpisywane ręcznie przez managera lub przez seed.

### Tabela: `inquiry_statuses` — statusy zapytań
```sql
CREATE TABLE inquiry_statuses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agent         TEXT NOT NULL,
  sheet_row_key TEXT NOT NULL,  -- unikalny klucz wiersza z arkusza (agent+data+oferta+email)
  status        TEXT NOT NULL,  -- 'contacted' | 'in_progress' | 'no_contact' | 'not_interested'
  comment       TEXT DEFAULT '',
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent, sheet_row_key)
);
```

### Tabela: `lead_statuses` — statusy leadów
```sql
CREATE TABLE lead_statuses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agent         TEXT NOT NULL,
  sheet_row_key TEXT NOT NULL,
  status        TEXT NOT NULL,  -- 'contacted' | 'in_progress' | 'no_contact' | 'meeting_set' | 'signed' | 'not_interested'
  comment       TEXT DEFAULT '',
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent, sheet_row_key)
);
```

---

## 7. Integracja z Google Sheets

### Architektura arkuszy

Aplikacja czyta dane z **3 rodzajów arkuszy Google**:

#### A) Arkusz centralny — WARUNKI BONUSÓW
- **ID:** `1wMUykuEbF0gjiwMgS3nOX6tyWZvaqwDMVwZaNiZFBrc`
- **Zakładka:** `WARUNKI BONUSÓW`
- **Plik:** `server/config/agentSheets.js` → `CENTRAL_SHEET_ID`
- **Zawiera:** listę wszystkich agentów ze wszystkich oddziałów

Kolumny arkusza WARUNKI BONUSÓW:
| Kolumna | Opis |
|---------|------|
| Agent | Imię i nazwisko agenta |
| Lokalizacja | Oddział (Warszawa / Kraków / Katowice) |
| Czy VAT | Czy agent rozlicza VAT |
| Pierwszy próg limit | Próg przychodu dla 1. poziomu bonusu (PLN) |
| Pierwszy próg procent | Procent prowizji na 1. poziomie |
| Drugi próg limit | Próg dla 2. poziomu |
| Drugi próg procent | Procent na 2. poziomie |
| Trzeci próg limit | Próg dla 3. poziomu |
| Trzeci próg procent | Procent na 3. poziomie |
| Agent Nieaktywny | "TAK" jeśli agent jest nieaktywny — wtedy pomijany |
| mail | E-mail agenta |
| Plik Prowizje-Bonusy | **ID arkusza** z przychodami i bonusami agenta |
| Plik Leady-Zapytania | **ID arkusza** z leadami i zapytaniami agenta |

> Przy starcie serwera (jeśli `GOOGLE_API_KEY` jest ustawiony) aplikacja **automatycznie ładuje** listę agentów z tego arkusza i uzupełnia `AGENT_SHEETS` i `AGENT_BONUS_SHEETS`.

#### B) Arkusze przychodów per oddział
- **Warszawa:** `1AWcZ8EUJPeDHaTppKbIy0X3izCbXWp1WHxBCRl4qV1k`
- **Kraków:** `1zMf4XBr-wSZtBj1FYOBIwsBcwK6VtHMyMi2cUUI8hnk`
- **Katowice:** `11TqcFTEgpxlxQ7r-TUyVR6xd9mbj-ooYC7wu3N2LEeo`
- **Plik:** `server/config/offices.json` → `revenueSheetId`

#### C) Arkusze per agent (prowizje + leady/zapytania)
- Każdy agent ma **2 osobne arkusze**
- ID arkuszy pobierane z WARUNKI BONUSÓW lub ustawiane ręcznie w `agentSheets.js`
- **`AGENT_BONUS_SHEETS`** — arkusz z transakcjami i wyliczonym bonusem agenta
- **`AGENT_SHEETS`** — arkusz z leadami i zapytaniami agenta (zakładki `Leady!A:P` i `Zapytania!A:P`)

### Cache Sheets
Wszystkie dane z Google Sheets są cache'owane w pamięci:
- Dane aktywności i przychodów: **5 minut** (`CACHE_TTL`)
- Lista agentów i oferty: **10 minut** (`OFERTY_CACHE_TTL`)

### Funkcje w `server/googleSheets.js`

| Funkcja | Opis |
|---------|------|
| `getRevenue(sheetId)` | Odczytuje przychody oddziału z arkusza (zakładka domyślna) |
| `getInquiries(sheetId, agentName)` | Odczytuje zapytania agenta z zakładki `Zapytania!A:P` |
| `getLeads(sheetId, agentName)` | Odczytuje leady agenta z zakładki `Leady!A:P` |
| `getAgentsFromBonusSheet(centralSheetId)` | Odczytuje listę agentów z WARUNKI BONUSÓW |
| `getAgentBonusSheet(sheetId)` | Odczytuje transakcje i bonusy agenta z jego arkusza |
| `getOferty(sheetId)` | Odczytuje oferty (filtruje po Biuro = Warszawa) |

---

## 8. Backend — API endpointy

### Autoryzacja
```
POST /api/auth
Body: { pin: "1234" }
Response: { role, name, office, color?, goal? }
```

### Agenci
```
GET /api/agents
→ lista agentów [{ name, color, goal, office }]

POST /api/agents/sync         (requireManager)
→ ładuje agentów z WARUNKI BONUSÓW i aktualizuje AGENT_SHEETS

GET /api/agents/bonus-sheet   (requireManager)
→ podgląd danych z arkusza WARUNKI BONUSÓW
```

### Wpisy aktywności
```
GET /api/entries              (requireAuth)
  ?week=2026-W17              — filtr tygodnia
  ?quarter=2026-Q2            — filtr kwartału
  ?agent=Mikołaj              — filtr agenta (manager/superadmin)

GET /api/entries/all          (requireManager)
  → wszystkie wpisy bez filtru

POST /api/entries             (requireAuth)
Body: { agent, calls, scheduled, done, pozyski, week, quarter, date }

DELETE /api/entries/week      (requireManager)
  ?week=2026-W17              — usuwa wszystkie wpisy danego tygodnia
```

### Przychody
```
GET /api/revenue              (requireAuth)
  ?quarter=q2-2026

GET /api/revenue/all          (requireAuth)
  → wszystkie kwartały

GET /api/revenue/agent/:name  (requireAuth)
  → przychody agenta z jego osobistego arkusza Sheets

POST /api/revenue             (requireManager)
Body: { agent, quarter, prowizja, transakcje }
→ upsert (wstawia lub aktualizuje)
```

### Zapytania
```
GET /api/inquiries/all               (requireManager)
→ zapytania wszystkich agentów z Sheets + statusy z DB

GET /api/inquiries/:agentName        (requireAuth)
→ zapytania jednego agenta

POST /api/inquiries/:agentName/status  (requireAuth)
Body: { sheet_row_key, status, comment }
→ ustawia status zapytania w DB
```

### Leady
```
GET /api/leads/all               (requireManager)
→ leady wszystkich agentów z Sheets + statusy z DB

GET /api/leads/:agentName        (requireAuth)
→ leady jednego agenta

POST /api/leads/:agentName/status  (requireAuth)
Body: { sheet_row_key, status, comment }
→ ustawia status leadu w DB
```

---

## 9. Frontend — widoki według roli

### Routing w `App.jsx`

Przy logowaniu aplikacja sprawdza `user.role` i wyświetla odpowiedni zestaw zakładek:

```
superadmin → SUPERADMIN_TABS
manager    → MANAGER_TABS
agent      → AGENT_TABS
```

---

### SUPERADMIN — zakładki

#### `revenue` → `Revenue.jsx`
**Przychody zespołu**

- Selektor kwartału (Q1-Q4 dla lat 2025-2026)
- **Selektor oddziału** (Wszystkie / Warszawa / Kraków / Katowice) — widoczny tylko dla superadmina
- Pasek postępu do celu zespołu (hardcoded: 300 000 PLN — do konfiguracji)
- 4 kafelki: Łączne przychody / % celu / Lider / Transakcje
- Tabela agentów z sortowaniem po prowizji lub transakcjach
  - Numer miejsca (medale 🥇🥈🥉 dla top 3)
  - Avatar agenta z kolorem
  - Oddział (widoczny dla superadmina)
  - Prowizja + % indywidualnego celu
  - Badge status: Cel! / Na kursie / W toku / Niski
- Wykres słupkowy z prowizjami agentów (kolorowy)

**Dane:** `GET /api/revenue?quarter=q2-2026` → DB

---

#### `activity` → `Activity.jsx`
**Aktywność zespołu**

- Przełącznik Tydzień / Kwartał
- 4 kafelki z trendami: Telefony / Spotkania / Pozyski / Konwersja
  - Trend = zmiana vs poprzedni tydzień (w trybie tygodniowym)
- Tabela agentów posortowana po pozyskach:
  - Telefony z trendem (↑/↓)
  - Spotkania
  - Pozyski (wyróżnione na zielono)
  - Konwersja (spotkania / telefony %)
- Wykres słupkowy grupowany: Telefony / Spotkania / Pozyski

**Dane:** `GET /api/entries?week=...` lub `?quarter=...` → DB

---

#### `inquiries` → `ManagerInquiries.jsx`
**Zapytania — widok managera**

- Filtry: agent (dropdown) / status / typ zapytania (tekst)
- Lista zapytań ze wszystkich agentów z Sheets
- Każdy wiersz: avatar agenta, dane klienta, telefon/email, numer oferty, data
- Zmiana statusu inline (dropdown z optymistyczną aktualizacją)
- Status zapisywany w DB (`inquiry_statuses`)

**Dane:** `GET /api/inquiries/all` → Sheets + DB

---

#### `leads` → `ManagerLeads.jsx`
**Leady — widok managera**

- Filtry: agent / status / szukaj po nazwisku klienta
- Tabela lub kanban (do wdrożenia) ze wszystkimi leadami
- 6 statusów: Skontaktowano się / Działamy / Brak kontaktu / Spotkanie / Podpisano / Niezainteresowany
- Zmiana statusu inline

**Dane:** `GET /api/leads/all` → Sheets + DB

---

#### `log` → `LogEntry.jsx`
**Wpis aktywności**

- Selektor agenta (dropdown dla managera/superadmina)
- 4 pola: Telefony / Umówione spotkania / Spotkania odbyły się / Pozyski
- Przycisk "Zapisz działania"
- Sekcja resetu tygodnia (tylko manager/superadmin) — usuwa wszystkie wpisy bieżącego tygodnia po potwierdzeniu

**Dane:** `POST /api/entries` → DB

---

### MANAGER — zakładki

Identyczne widoki jak Superadmin, z jedną różnicą:
- Brak selektora oddziału w Revenue — manager widzi tylko swój oddział
- Dodatkowa zakładka **Oceny**

#### `evaluations` → `Evaluations.jsx`
**Oceny agentów**

- Selektor tygodnia (bieżący / poprzedni / 2 tygodnie temu)
- Karta dla każdego agenta zawierająca:
  - Avatar, imię, badge oceny (Wybitny / Dobry / Średni / Do poprawy)
  - Wynik punktowy (0-8 pkt)
  - **Automatyczny komentarz AI** (generowany lokalnie na podstawie danych)
  - 4 metryki: Telefony / Spotkania / Pozyski / Pozyski kwartalne
  - Mini wykres słupkowy historii telefonów (6 tygodni)

**Algorytm oceny (evalScore w `utils.js`):**
```
+2 pkt — ≥ 50 telefonów w tygodniu
+1 pkt — ≥ 25 telefonów
+3 pkt — ≥ 3 pozyski
+2 pkt — ≥ 1 pozysk
+2 pkt — konwersja ≥ 5% (spotkania/telefony)
+1 pkt — konwersja ≥ 2%
+1 pkt — wzrost telefonów > 10% vs poprzedni tydzień
→ Łącznie max 8 pkt
```

**Progi ocen:**
- 7-8 pkt → **Wybitny** (zielony)
- 5-6 pkt → **Dobry** (niebieski)
- 3-4 pkt → **Średni** (złoty)
- 0-2 pkt → **Do poprawy** (czerwony)

**Dane:** `GET /api/entries/all` → DB

---

### AGENT — zakładki

#### `myrevenue` → `MyRevenue.jsx`
**Moje przychody**

- Avatar agenta + selektor kwartału
- Duży pasek postępu do celu kwartalnego z procentem
- Badge status: Cel! / Na kursie / W toku / Niski
- 4 kafelki: Prowizja / Transakcje / Miejsce w teamie / Udział w przychodach zespołu
- Sekcja progów bonusowych:
  - 3 progi (placeholder — będą uzupełnione z WARUNKI BONUSÓW po podłączeniu Sheets)
  - Dla każdego progu: pasek postępu, status (osiągnięty / ile brakuje)
- Sekcja transakcji (placeholder — szczegóły po podłączeniu arkusza prowizji)

**Dane:** `GET /api/revenue?quarter=...` → DB (docelowo z arkusza `Plik Prowizje-Bonusy`)

---

#### `stats` → `MyStats.jsx`
**Moje wyniki**

- Avatar agenta + nagłówek "Bieżący tydzień"
- **Miniaturka przychodów** — pasek postępu celu kwartalnego z kwotą (linki do zakładki Moje przychody)
- 4 kafelki aktywności z trendami vs poprzedni tydzień: Telefony / Spotkania / Pozyski / Konwersja
- Wykres słupkowy historii telefonów (6 tygodni wstecz) — kolor agenta
- Pasek postępu pozysk kwartalnych

**Dane:**
- `GET /api/entries` → DB (filtrowane przez serwer do aktualnego agenta)
- `GET /api/revenue?quarter=...` → DB

---

#### `leaderboard` → `Leaderboard.jsx`
**Ranking zespołu**

- Bieżący tydzień
- Karty agentów posortowane po pozyskach → telefonach
- Własna karta wyróżniona kolorową ramką i tłem
- Dla każdego agenta: medal/numer, avatar, pasek aktywności, liczba pozysk i telefonów

**Dane:** `GET /api/entries?week=...` → DB

---

#### `inquiries` → `Inquiries.jsx`
**Moje zapytania**

- Pull-to-refresh (swipe down na mobile)
- Lista zapytań z arkusza agenta (zakładka `Zapytania`)
- Każde zapytanie: dane klienta, e-mail/telefon, numer oferty, data, typ
- Status inline (4 opcje) — zapisywany w DB, natychmiastowa aktualizacja (optimistic UI)
- Informacja gdy arkusz nie jest skonfigurowany

**Dane:** `GET /api/inquiries/:agentName` → Sheets + DB

---

#### `leads` → `Leads.jsx`
**Moje leady**

- Lista leadów z arkusza agenta (zakładka `Leady`)
- Każdy lead: klient, kontakt, numer oferty, data, źródło
- 6 statusów z kolorowymi pigułkami
- Podsumowanie pipeline'u u góry (liczba per status)

**Dane:** `GET /api/leads/:agentName` → Sheets + DB

---

#### `log` → `LogEntry.jsx`
**Wpis**

- Formularz z 4 polami (bez selektora agenta — agent widzi tylko siebie)
- Identyczny komponent jak u managera, ale bez dropdown agenta i bez przycisku reset

**Dane:** `POST /api/entries` → DB

---

## 10. Komponenty współdzielone

### `MetricCard`
Kafelek z metryką. Props: `label`, `value`, `sub`, `color`, `trend` (liczba — wyświetla +/- z kolorem).

### `ProgressBar`
Pasek postępu. Props: `value`, `max`, `color`, `height`.

### `AgentAvatar`
Kółko z inicjałami agenta. Props: `name`, `color`, `size`.

### `Toast`
Powiadomienie slide-in. Props: `message`, `type` (`success`/`error`), `onClose`.

### `Login`
Klawiatura PIN 4-cyfrowa. Animacja shake przy błędnym PINie. Po wpisaniu 4 cyfr automatycznie wysyła żądanie.

### `BottomNav`
Dolna nawigacja (tylko mobile — ukryta na `md:hidden`). Na desktopie zakładki w headerze. Ikony SVG dla każdej zakładki.

---

## 11. Stan do zrobienia (TODO)

### Krytyczne (wymagane do działania)
- [ ] **Wkleić `GOOGLE_API_KEY`** do pliku `.env` — bez tego Sheets nie działają
- [ ] **Uzupełnić agentów Kraków i Katowice** w `server/config/offices.json` (PINy, e-maile, kolory)

### Integracja Sheets (po ustawieniu API Key)
- [ ] Zrozumieć strukturę kolumn w arkuszach `Plik Prowizje-Bonusy` agentów → dopasować kolumny w `getAgentBonusSheet()`
- [ ] Wyświetlić rzeczywiste transakcje w `MyRevenue.jsx` (sekcja "Transakcje")
- [ ] Pobrać progi bonusowe z WARUNKI BONUSÓW i wyświetlić w `MyRevenue.jsx`
- [ ] Zastąpić dane przychodu w DB danymi z arkuszy prowizji per agent

### Funkcjonalności do rozbudowy
- [ ] **Plan kwartalny** — nowy widok dla superadmina z celami per oddział i agentów na kolejny kwartał
- [ ] **Oceny → wysyłanie e-maila** — przycisk "Wyślij ocenę" z podsumowaniem tygodniowym do agenta
- [ ] **Ranking przychodów** — osobna zakładka w widoku superadmina (ranking prowizji między oddziałami)
- [ ] **Windykacja / nieopłacone** — kolumna status płatności transakcji gdy znana będzie struktura arkuszy prowizji
- [ ] **Cele indywidualne** — tabela `agent_goals` w DB dla tygodniowych/miesięcznych/kwartalnych celów aktywności
- [ ] **Google OAuth** — infrastruktura jest w `server/routes/auth.js`, wymaga konfiguracji klienta OAuth

---

*Dokument aktualny na dzień 2026-04-29. Aplikacja jest w fazie rozwoju — dane w DB są przykładowe (seed data).*
