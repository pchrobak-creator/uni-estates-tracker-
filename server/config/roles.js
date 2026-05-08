const AGENTS = [
  { name: 'Hanna',    pin: '1001', email: 'h.raj@uniestates.pl',          color: '#1D9E75', goal: 50000,  office: 'Warszawa' },
  { name: 'Michał',   pin: '1002', email: 'm.filip@uniestates.pl',        color: '#378ADD', goal: 75000,  office: 'Warszawa' },
  { name: 'Nikolay',  pin: '1003', email: 'n.hadzhikostov@uniestates.pl', color: '#D85A30', goal: 75000,  office: 'Warszawa' },
  { name: 'Grzegorz', pin: '1004', email: 'g.jakubik@uniestates.pl',      color: '#7F77DD', goal: 75000,  office: 'Warszawa' },
  { name: 'Piotr',    pin: '1005', email: 'p.zajkowski@uniestates.pl',    color: '#BA7517', goal: 75000,  office: 'Warszawa' },
  { name: 'Mikołaj',  pin: '1006', email: 'm.sporek@uniestates.pl',       color: '#D4537E', goal: 87500,  office: 'Warszawa' },
];

// p.chrobak i z.michalak mają dostęp superadmin ORAZ manager swojego oddziału
const SUPER_ADMIN_EMAILS = ['p.chrobak@uniestates.pl', 'z.michalak@uniestates.pl'];

const MANAGER_MAP = {
  'p.chrobak@uniestates.pl':  'Warszawa',
  'z.michalak@uniestates.pl': 'Kraków',
  'k.trybala@uniestates.pl':  'Katowice',
};

function getUserFromEmail(email) {
  if (!email || !email.endsWith('@uniestates.pl')) return null;

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
  const managerOffice = MANAGER_MAP[email];

  if (isSuperAdmin) {
    return { role: 'superadmin', office: managerOffice || null };
  }
  if (managerOffice) {
    return { role: 'manager', office: managerOffice };
  }

  const agent = AGENTS.find(a => a.email === email);
  if (agent) {
    return {
      role: 'agent',
      agentName: agent.name,
      color: agent.color,
      goal: agent.goal,
      office: agent.office,
    };
  }

  // Każdy inny pracownik @uniestates.pl dostaje podstawowy dostęp agenta
  return {
    role: 'agent',
    agentName: email.split('@')[0],
    color: '#9A9A94',
    goal: 75000,
    office: 'Warszawa',
  };
}

module.exports = { getUserFromEmail, AGENTS, SUPER_ADMIN_EMAILS, MANAGER_MAP };
