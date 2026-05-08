export function getWeekKey(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  const y = d.getFullYear();
  const jan1 = new Date(y, 0, 1);
  const w = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

export function getQuarterKey() {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
}

export function getRevenueQuarterKey(offset = 0) {
  const d = new Date();
  let q = Math.ceil((d.getMonth() + 1) / 3) - offset;
  let y = d.getFullYear();
  while (q <= 0) { q += 4; y--; }
  while (q > 4) { q -= 4; y++; }
  return `q${q}-${y}`;
}

export function formatPLN(amount) {
  if (amount == null) return '0 zł';
  return (
    Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł'
  );
}

export function formatNum(n) {
  if (n == null) return '0';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getWeekLabel(weekKey) {
  if (!weekKey) return '';
  const [year, w] = weekKey.split('-W');
  const weekNum = parseInt(w);
  const current = getWeekKey(0);
  const prev = getWeekKey(-1);
  const prev2 = getWeekKey(-2);
  if (weekKey === current) return 'Bieżący tydzień';
  if (weekKey === prev) return 'Poprzedni tydzień';
  if (weekKey === prev2) return '2 tygodnie temu';
  return `Tydzień ${weekNum} / ${year}`;
}

export function getQuarterLabel(qKey) {
  if (!qKey) return '';
  const [q, y] = qKey.split('-');
  return `${q.toUpperCase()} ${y}`;
}

export function aggregateEntries(entries) {
  return entries.reduce(
    (acc, e) => ({
      calls: acc.calls + (e.calls || 0),
      scheduled: acc.scheduled + (e.scheduled || 0),
      done: acc.done + (e.done || 0),
      pozyski: acc.pozyski + (e.pozyski || 0),
    }),
    { calls: 0, scheduled: 0, done: 0, pozyski: 0 }
  );
}

export function conversionRate(done, calls) {
  if (!calls) return 0;
  return (done / calls) * 100;
}

export function evalScore(stats, prevStats) {
  let score = 0;
  if (stats.calls >= 50) score += 2;
  else if (stats.calls >= 25) score += 1;
  if (stats.pozyski >= 3) score += 3;
  else if (stats.pozyski >= 1) score += 2;
  const conv = conversionRate(stats.done, stats.calls);
  if (conv >= 5) score += 2;
  else if (conv >= 2) score += 1;
  if (prevStats && prevStats.calls > 0 && stats.calls > prevStats.calls * 1.1) score += 1;
  return score;
}

export function evalBadge(score) {
  if (score >= 7) return { label: 'Wybitny', color: '#1D9E75', bg: '#E1F5EE' };
  if (score >= 5) return { label: 'Dobry', color: '#378ADD', bg: '#EAF2FF' };
  if (score >= 3) return { label: 'Średni', color: '#BA7517', bg: '#FEF3E2' };
  return { label: 'Do poprawy', color: '#D85A30', bg: '#FDEEE8' };
}

export function evalComment(agentName, stats, prevStats, score) {
  const conv = conversionRate(stats.done, stats.calls).toFixed(1);
  const badge = evalBadge(score);

  if (score >= 7) {
    return `${agentName} osiągnął wybitne wyniki w tym tygodniu — ${stats.calls} telefonów i ${stats.pozyski} pozysk${stats.pozyski === 1 ? 'i' : 'ów'} to doskonałe rezultaty. Konwersja na poziomie ${conv}% świadczy o wysokiej skuteczności.`;
  }
  if (score >= 5) {
    return `${agentName} wypracował dobre wyniki: ${stats.calls} telefonów i ${stats.pozyski} pozysk${stats.pozyski === 1 ? 'i' : 'ów'}. Warto utrzymać tempo i popracować nad dalszym zwiększeniem konwersji (${conv}%).`;
  }
  if (score >= 3) {
    return `${agentName} osiągnął przeciętne wyniki — ${stats.calls} telefonów i ${stats.pozyski} pozysk${stats.pozyski === 1 ? 'i' : 'ów'}. Rekomendujemy zwiększenie aktywności telefonicznej do min. 50 tygodniowo i skupienie się na pozyskach.`;
  }
  return `${agentName} wymaga poprawy — ${stats.calls} telefonów i ${stats.pozyski} pozysk${stats.pozyski === 1 ? 'i' : 'ów'} to wynik poniżej oczekiwań. Cel: minimum 50 telefonów tygodniowo. Należy zwiększyć aktywność i skupić się na realizacji celów.`;
}

export function statusBadge(prowizja, goal) {
  const pct = goal ? prowizja / goal : 0;
  if (pct >= 1) return { label: 'Cel!', color: '#1D9E75', bg: '#E1F5EE' };
  if (pct >= 0.7) return { label: 'Na kursie', color: '#378ADD', bg: '#EAF2FF' };
  if (pct >= 0.4) return { label: 'W toku', color: '#BA7517', bg: '#FEF3E2' };
  return { label: 'Niski', color: '#D85A30', bg: '#FDEEE8' };
}

const API_BASE = '';

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const pin = sessionStorage.getItem('pin');
  if (pin) headers['x-pin'] = pin;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Błąd serwera');
  }
  return res.json();
}
