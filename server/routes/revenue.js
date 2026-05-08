const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireManager } = require('../auth');
const { getAgentBonusSheet } = require('../googleSheets');
const { AGENT_BONUS_SHEETS } = require('../config/agentSheets');

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

// Agent's personal revenue + bonus data from their individual Google Sheet
router.get('/agent/:agentName', requireAuth, async (req, res) => {
  const { agentName } = req.params;
  if (req.user.role === 'agent' && req.user.name !== agentName) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  const sheetId = AGENT_BONUS_SHEETS[agentName];
  if (!sheetId) {
    return res.json({ rows: [], notConfigured: true });
  }
  try {
    const rows = await getAgentBonusSheet(sheetId);
    res.json({ rows, notConfigured: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
