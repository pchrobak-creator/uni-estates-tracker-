const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireManager } = require('../auth');
const { getLeads } = require('../googleSheets');
const { AGENT_SHEETS } = require('../config/agentSheets');

const PLACEHOLDER = 'SPREADSHEET_ID_';

router.get('/all', requireManager, async (req, res) => {
  try {
    const results = [];
    for (const [agentName, sheetId] of Object.entries(AGENT_SHEETS)) {
      if (sheetId.startsWith(PLACEHOLDER)) continue;
      try {
        const rows = await getLeads(sheetId, agentName);
        const statuses = db.prepare('SELECT * FROM lead_statuses WHERE agent = ?').all(agentName);
        const statusMap = Object.fromEntries(statuses.map(s => [s.sheet_row_key, s]));
        results.push(...rows.map(r => ({ ...r, _agent: agentName, _status: statusMap[r._key] || null })));
      } catch {}
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:agentName', requireAuth, async (req, res) => {
  const { agentName } = req.params;
  if (req.user.role === 'agent' && req.user.name !== agentName) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }

  const sheetId = AGENT_SHEETS[agentName];
  if (!sheetId || sheetId.startsWith(PLACEHOLDER)) {
    return res.json({ rows: [], notConfigured: true });
  }

  try {
    const rows = await getLeads(sheetId, agentName);
    const statuses = db.prepare('SELECT * FROM lead_statuses WHERE agent = ?').all(agentName);
    const statusMap = Object.fromEntries(statuses.map(s => [s.sheet_row_key, s]));
    const merged = rows.map(r => ({ ...r, _status: statusMap[r._key] || null }));
    res.json({ rows: merged, notConfigured: false });
  } catch (err) {
    const statuses = db.prepare('SELECT * FROM lead_statuses WHERE agent = ?').all(agentName);
    res.json({ rows: [], notConfigured: false, error: err.message, cachedStatuses: statuses });
  }
});

router.get('/:agentName/statuses', requireAuth, (req, res) => {
  const { agentName } = req.params;
  if (req.user.role === 'agent' && req.user.name !== agentName) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  const rows = db.prepare('SELECT * FROM lead_statuses WHERE agent = ?').all(agentName);
  res.json(rows);
});

router.post('/:agentName/status', requireAuth, (req, res) => {
  const { agentName } = req.params;
  if (req.user.role === 'agent' && req.user.name !== agentName) {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  const { sheet_row_key, status, comment = '' } = req.body;
  if (!sheet_row_key || !status) return res.status(400).json({ error: 'Brakujące pola' });

  db.prepare(`
    INSERT INTO lead_statuses (agent, sheet_row_key, status, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(agent, sheet_row_key) DO UPDATE SET
      status = excluded.status,
      comment = excluded.comment,
      updated_at = CURRENT_TIMESTAMP
  `).run(agentName, sheet_row_key, status, comment);

  res.json({ ok: true });
});

module.exports = router;
