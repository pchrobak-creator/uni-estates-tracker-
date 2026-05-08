const { google } = require('googleapis');
const cache = require('./cache');

const CACHE_TTL = 5 * 60 * 1000;
const OFERTY_CACHE_TTL = 10 * 60 * 1000;

function getSheets() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Brak GOOGLE_API_KEY w pliku .env');
  return google.sheets({ version: 'v4', auth: apiKey });
}

async function getSheetValues(spreadsheetId, range) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const [headers, ...data] = rows;
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
    return obj;
  });
}

function makeRowKey(agentName, date, numerOferty, email) {
  return [agentName, date, numerOferty, email]
    .join('_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

async function getSheetRaw(spreadsheetId, range) {
  const cacheKey = `raw_${spreadsheetId}_${range}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const rows = await getSheetValues(spreadsheetId, range);
  const result = rowsToObjects(rows);
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function getRevenue(spreadsheetId) {
  const cacheKey = `revenue_${spreadsheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const rows = await getSheetValues(spreadsheetId, 'A:Z');
  const result = rowsToObjects(rows);
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function getInquiries(spreadsheetId, agentName) {
  const cacheKey = `inquiries_${spreadsheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await getSheetValues(spreadsheetId, 'Zapytania!A:P');
  const objects = rowsToObjects(rows).filter(r =>
    r['Dane Klienta'] || r['Email'] || r['Telefon']
  );
  const result = objects.map(r => ({
    ...r,
    _key: makeRowKey(agentName, r['Data'], r['Numer oferty'], r['Email']),
  }));
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function getLeads(spreadsheetId, agentName) {
  const cacheKey = `leads_${spreadsheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await getSheetValues(spreadsheetId, 'Leady!A:P');
  const objects = rowsToObjects(rows).filter(r =>
    r['Imię i Nazwisko Klienta'] || r['Dane Kontaktowe Klienta']
  );
  const result = objects.map(r => ({
    ...r,
    _key: makeRowKey(agentName, r['Data Utworzenia'], r['Numer Oferty'], r['Dane Kontaktowe Klienta']),
  }));
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function getOferty(spreadsheetId) {
  const cacheKey = `oferty_${spreadsheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await getSheetValues(spreadsheetId, 'A:Z');
  const objects = rowsToObjects(rows).filter(r => r['Id nieruchomości'] && r['Biuro'] === 'Warszawa');
  cache.set(cacheKey, objects, OFERTY_CACHE_TTL);
  return objects;
}

async function getAgentBonusSheet(sheetId) {
  const cacheKey = `agent_bonus_${sheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await getSheetValues(sheetId, 'A:Z');
  const result = rowsToObjects(rows).filter(r => Object.values(r).some(v => v !== ''));
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function getAgentsFromBonusSheet(centralSheetId) {
  const cacheKey = `bonus_agents_${centralSheetId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await getSheetValues(centralSheetId, 'WARUNKI BONUSÓW!A:M');
  const agents = rowsToObjects(rows)
    .filter(r => r['Agent'] && r['Agent Nieaktywny'] !== 'TAK')
    .map(r => ({
      name: r['Agent'],
      office: r['Lokalizacja'],
      email: r['mail'] || '',
      bonusSheetId: r['Plik Prowizje-Bonusy'] || '',
      leadsSheetId: r['Plik Leady-Zapytania'] || '',
      vat: r['Czy VAT'] || '',
      thresholds: [
        { limit: parseFloat(r['Pierwszy próg limit']) || 0,  pct: parseFloat(r['Pierwszy próg procent']) || 0 },
        { limit: parseFloat(r['Drugi próg limit'])   || 0,  pct: parseFloat(r['Drugi próg procent'])   || 0 },
        { limit: parseFloat(r['Trzeci próg limit'])  || 0,  pct: parseFloat(r['Trzeci próg procent'])  || 0 },
      ],
    }));

  cache.set(cacheKey, agents, OFERTY_CACHE_TTL);
  return agents;
}

module.exports = { getSheetRaw, getRevenue, getInquiries, getLeads, getOferty, getAgentsFromBonusSheet, getAgentBonusSheet };
