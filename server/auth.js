const jwt = require('jsonwebtoken');
const { AGENTS } = require('./config/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const MANAGER_PINS = [
  { pin: '1234', name: 'Piotr Chrobak',    role: 'superadmin', office: 'Warszawa', email: 'p.chrobak@uniestates.pl' },
  { pin: '2234', name: 'Zbigniew Michalak', role: 'superadmin', office: 'Kraków',   email: 'z.michalak@uniestates.pl' },
  { pin: '3234', name: 'Katarzyna Trybala', role: 'manager',    office: 'Katowice', email: 'k.trybala@uniestates.pl' },
];

// PIN → user (dla trybu PIN)
function validatePin(pin) {
  const mgr = MANAGER_PINS.find(m => m.pin === pin);
  if (mgr) return { role: mgr.role, name: mgr.name, office: mgr.office };
  const agent = AGENTS.find(a => a.pin === pin);
  if (agent) return { role: 'agent', name: agent.name, color: agent.color, goal: agent.goal, office: agent.office };
  return null;
}

// Middleware — obsługuje zarówno PIN (x-pin header) jak i JWT (Bearer token)
function requireAuth(req, res, next) {
  // JWT Bearer
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'Token wygasł lub nieprawidłowy' });
    }
  }

  // PIN fallback
  const pin = req.headers['x-pin'] || req.query.pin;
  if (!pin) return res.status(401).json({ error: 'Brak autoryzacji' });
  const user = validatePin(pin);
  if (!user) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  req.user = user;
  next();
}

function requireManager(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  });
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  });
}

module.exports = { requireAuth, requireManager, requireSuperAdmin, validatePin, AGENTS };
