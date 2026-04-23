const express = require('express');
const cors = require('cors');
const path = require('path');
const { validatePin, AGENTS } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/auth', (req, res) => {
  const { pin } = req.body;
  const user = validatePin(pin);
  if (!user) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  res.json({ ...user, pin });
});

app.get('/api/agents', (req, res) => {
  res.json(AGENTS.map(a => ({ name: a.name, color: a.color, goal: a.goal })));
});

app.use('/api/entries', require('./routes/entries'));
app.use('/api/revenue', require('./routes/revenue'));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Uni Estates Tracker server running on port ${PORT}`);
});
