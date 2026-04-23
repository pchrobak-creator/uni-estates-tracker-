const AGENTS = [
  { name: 'Hanna',    pin: '1001', color: '#1D9E75', goal: 50000 },
  { name: 'Michał',   pin: '1002', color: '#378ADD', goal: 75000 },
  { name: 'Nikolay',  pin: '1003', color: '#D85A30', goal: 75000 },
  { name: 'Grzegorz', pin: '1004', color: '#7F77DD', goal: 75000 },
  { name: 'Piotr',    pin: '1005', color: '#BA7517', goal: 75000 },
  { name: 'Mikołaj',  pin: '1006', color: '#D4537E', goal: 87500 },
];

const MANAGER_PIN = '1234';

function validatePin(pin) {
  if (pin === MANAGER_PIN) {
    return { role: 'manager', name: 'Manager' };
  }
  const agent = AGENTS.find(a => a.pin === pin);
  if (agent) {
    return { role: 'agent', name: agent.name, color: agent.color, goal: agent.goal };
  }
  return null;
}

function requireAuth(req, res, next) {
  const pin = req.headers['x-pin'] || req.query.pin;
  if (!pin) return res.status(401).json({ error: 'Brak autoryzacji' });
  const user = validatePin(pin);
  if (!user) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  req.user = user;
  next();
}

function requireManager(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  });
}

module.exports = { AGENTS, MANAGER_PIN, validatePin, requireAuth, requireManager };
