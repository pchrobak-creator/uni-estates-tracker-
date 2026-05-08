// Central file: "UNI ESTATES PRZYCHODY CAŁOŚĆ - GŁÓWNY" — contains WARUNKI BONUSÓW tab
const CENTRAL_SHEET_ID = '1wMUykuEbF0gjiwMgS3nOX6tyWZvaqwDMVwZaNiZFBrc';

// Agent leads/inquiries sheet IDs — keyed by agent name, populated from WARUNKI BONUSÓW at startup
const AGENT_SHEETS = {
  'Mikołaj':  '1xrZlb5vFe-CgC-jJz5iZ3V06I0171ioOPOyJBNLjECk',
  'Michał':   'SPREADSHEET_ID_MICHAL',
  'Nikolay':  'SPREADSHEET_ID_NIKOLAY',
  'Grzegorz': 'SPREADSHEET_ID_GRZEGORZ',
  'Hanna':    'SPREADSHEET_ID_HANNA',
  'Piotr':    'SPREADSHEET_ID_PIOTR',
};

// Agent bonus/revenue sheet IDs — keyed by agent name, populated from WARUNKI BONUSÓW at startup
const AGENT_BONUS_SHEETS = {};

function applyAgentSheets(agents) {
  agents.forEach(a => {
    if (a.name && a.leadsSheetId) AGENT_SHEETS[a.name] = a.leadsSheetId;
    if (a.name && a.bonusSheetId) AGENT_BONUS_SHEETS[a.name] = a.bonusSheetId;
  });
}

module.exports = { AGENT_SHEETS, AGENT_BONUS_SHEETS, CENTRAL_SHEET_ID, applyAgentSheets };
