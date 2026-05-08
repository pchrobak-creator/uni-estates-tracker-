const express = require('express');
const cors = require('cors');
const path = require('path');
const { AGENTS } = require('./config/roles');
const { CENTRAL_SHEET_ID, AGENT_SHEETS, applyAgentSheets } = require('./config/agentSheets');
const { validatePin } = require('./auth');
const { requireAuth, requireManager } = require('./auth');
const { getAgentsFromBonusSheet } = require('./googleSheets');

const app = express();
const PORT = process.env.PORT || 3001;

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

// Auth (Google OAuth + JWT verify)
app.use('/auth', require('./routes/auth'));

// PIN auth endpoint
app.post('/api/auth', (req, res) => {
  const { pin } = req.body;
  const user = validatePin(pin);
  if (!user) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  res.json({ ...user, pin });
});

// Agent list (for UI dropdowns)
app.get('/api/agents', (req, res) => {
  res.json(AGENTS.map(a => ({ name: a.name, color: a.color, goal: a.goal, office: a.office })));
});

// Sync agents from central Google Sheet (manager+)
app.post('/api/agents/sync', requireManager, async (req, res) => {
  try {
    const agents = await getAgentsFromBonusSheet(CENTRAL_SHEET_ID);
    applyAgentSheets(agents);
    res.json({ ok: true, count: agents.length, agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview agents from central sheet (manager+)
app.get('/api/agents/bonus-sheet', requireManager, async (req, res) => {
  try {
    const agents = await getAgentsFromBonusSheet(CENTRAL_SHEET_ID);
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/entries',   require('./routes/entries'));
app.use('/api/revenue',   require('./routes/revenue'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/leads',     require('./routes/leads'));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`Uni Estates Tracker server running on port ${PORT}`);
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'WKLEJ_TUTAJ_API_KEY') {
    try {
      const agents = await getAgentsFromBonusSheet(CENTRAL_SHEET_ID);
      applyAgentSheets(agents);
      console.log(`Loaded ${agents.length} agents from WARUNKI BONUSÓW`);
    } catch (e) {
      console.warn('Could not load agents from central sheet:', e.message);
    }
  }
});
