const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tracker.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    calls INTEGER DEFAULT 0,
    scheduled INTEGER DEFAULT 0,
    done INTEGER DEFAULT 0,
    pozyski INTEGER DEFAULT 0,
    week TEXT NOT NULL,
    quarter TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    quarter TEXT NOT NULL,
    prowizja REAL DEFAULT 0,
    transakcje INTEGER DEFAULT 0,
    UNIQUE(agent, quarter)
  );

  CREATE TABLE IF NOT EXISTS inquiry_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    sheet_row_key TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent, sheet_row_key)
  );

  CREATE TABLE IF NOT EXISTS lead_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    sheet_row_key TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent, sheet_row_key)
  );
`);

const revCount = db.prepare('SELECT COUNT(*) as cnt FROM revenue').get();
if (revCount.cnt === 0) {
  const ins = db.prepare('INSERT OR IGNORE INTO revenue (agent, quarter, prowizja, transakcje) VALUES (?, ?, ?, ?)');
  ins.run('Michał',    'q3-2025', 17428,  8);
  ins.run('Mikołaj',   'q3-2025', 35689,  3);
  ins.run('Michał',    'q4-2025', 16715, 13);
  ins.run('Mikołaj',   'q4-2025',  7200,  2);
  ins.run('Aleksandra','q4-2025',  3823,  2);
  ins.run('Mikołaj',   'q1-2026', 50013, 13);
  ins.run('Michał',    'q1-2026', 17623,  6);
  ins.run('Nikolay',   'q1-2026', 21147,  8);
  ins.run('Grzegorz',  'q1-2026', 13022,  5);
  ins.run('Aleksandra','q1-2026',  3423,  2);
  ins.run('Mikołaj',   'q2-2026',  9812,  4);
  ins.run('Michał',    'q2-2026', 17501,  6);
  ins.run('Nikolay',   'q2-2026',  6913,  4);
  ins.run('Grzegorz',  'q2-2026', 10434,  4);
}

// Seed sample activity entries for demo purposes
const entCount = db.prepare('SELECT COUNT(*) as cnt FROM entries').get();
if (entCount.cnt === 0) {
  const insE = db.prepare(
    'INSERT INTO entries (agent, calls, scheduled, done, pozyski, week, quarter, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const AGENTS = ['Michał','Mikołaj','Nikolay','Grzegorz','Hanna','Piotr'];
  const baseWeek = [17, 16, 15, 14, 13, 12]; // weeks back from W17

  const seedData = {
    Michał:   [25,4,3,1,  22,3,2,1,  28,5,4,2,  20,3,2,0,  18,2,1,0,  30,5,4,2],
    Mikołaj:  [35,6,5,3,  32,5,4,2,  38,7,6,3,  30,5,4,2,  28,4,3,1,  40,8,6,4],
    Nikolay:  [20,3,2,1,  18,2,2,0,  22,4,3,1,  15,2,1,0,  20,3,2,1,  25,4,3,2],
    Grzegorz: [18,3,2,1,  15,2,1,0,  20,3,3,1,  12,2,1,0,  16,2,2,1,  22,4,3,1],
    Hanna:    [10,1,1,0,  8,1,0,0,   12,2,1,0,  10,1,1,0,  9,1,1,0,   14,2,2,1],
    Piotr:    [15,2,1,0,  12,2,1,0,  17,3,2,1,  10,1,1,0,  13,2,1,0,  18,3,2,1],
  };

  for (const agent of AGENTS) {
    const data = seedData[agent];
    for (let i = 0; i < 6; i++) {
      const wNum = 17 - (5 - i);
      const wKey = `2026-W${String(wNum).padStart(2, '0')}`;
      const qKey = '2026-Q2';
      const offset = i * 4;
      insE.run(agent, data[offset], data[offset+1], data[offset+2], data[offset+3], wKey, qKey, `2026-04-${String(i+1).padStart(2,'0')}T10:00:00.000Z`);
    }
  }
}

module.exports = db;
