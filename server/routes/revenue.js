const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireManager } = require('../auth');

router.get('/all', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM revenue ORDER BY quarter DESC, prowizja DESC').all();
  res.json(rows);
});

router.get('/', requireAuth, (req, res) => {
  const { quarter } = req.query;
  let query = 'SELECT * FROM revenue';
  const params = [];

  if (quarter) {
    query += ' WHERE quarter = ?';
    params.push(quarter);
  }

  query += ' ORDER BY prowizja DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.post('/', requireManager, (req, res) => {
  const { agent, quarter, prowizja, transakcje } = req.body;
  if (!agent || !quarter) return res.status(400).json({ error: 'Brakujące pola' });

  const stmt = db.prepare(`
    INSERT INTO revenue (agent, quarter, prowizja, transakcje)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(agent, quarter) DO UPDATE SET
      prowizja = excluded.prowizja,
      transakcje = excluded.transakcje
  `);
  stmt.run(agent, quarter, prowizja || 0, transakcje || 0);
  res.json({ ok: true });
});

module.exports = router;
