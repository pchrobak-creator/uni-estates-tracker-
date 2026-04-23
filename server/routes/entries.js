const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireManager } = require('../auth');

router.get('/all', requireManager, (req, res) => {
  const rows = db.prepare('SELECT * FROM entries ORDER BY created_at DESC').all();
  res.json(rows);
});

router.get('/', requireAuth, (req, res) => {
  const { week, quarter, agent } = req.query;
  let query = 'SELECT * FROM entries WHERE 1=1';
  const params = [];

  if (req.user.role === 'agent') {
    query += ' AND agent = ?';
    params.push(req.user.name);
  } else if (agent) {
    query += ' AND agent = ?';
    params.push(agent);
  }

  if (week) {
    query += ' AND week = ?';
    params.push(week);
  }
  if (quarter) {
    query += ' AND quarter = ?';
    params.push(quarter);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { calls, scheduled, done, pozyski, week, quarter, date } = req.body;
  const agent = req.user.role === 'agent' ? req.user.name : req.body.agent;

  if (!agent || !week || !quarter || !date) {
    return res.status(400).json({ error: 'Brakujące pola' });
  }

  const stmt = db.prepare(
    'INSERT INTO entries (agent, calls, scheduled, done, pozyski, week, quarter, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(agent, calls || 0, scheduled || 0, done || 0, pozyski || 0, week, quarter, date);
  res.json({ id: result.lastInsertRowid, ok: true });
});

router.delete('/week', requireManager, (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: 'Brak tygodnia' });
  db.prepare('DELETE FROM entries WHERE week = ?').run(week);
  res.json({ ok: true });
});

module.exports = router;
