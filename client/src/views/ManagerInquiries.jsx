import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils';
import AgentAvatar from '../components/AgentAvatar';

const INQUIRY_STATUSES = [
  { value: 'contacted',      label: 'Skontaktowano się', color: '#1D9E75', bg: '#E1F5EE' },
  { value: 'in_progress',    label: 'Działamy',          color: '#378ADD', bg: '#EAF2FF' },
  { value: 'no_contact',     label: 'Brak kontaktu',     color: '#BA7517', bg: '#FEF3E2' },
  { value: 'not_interested', label: 'Niezainteresowany', color: '#9A9A94', bg: '#F0F0EE' },
];

export default function ManagerInquiries({ agents }) {
  const AGENT_COLORS = Object.fromEntries(agents.map(a => [a.name, a.color]));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/inquiries/all');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const agentNames = agents.map(a => a.name);

  const filtered = rows.filter(r => {
    if (filterAgent && r._agent !== filterAgent) return false;
    if (filterStatus && r._status?.status !== filterStatus) return false;
    if (filterType) {
      const typ = (r['Typ transakcji'] || '').toLowerCase();
      if (filterType === 'wynajem' && !typ.includes('wynajem')) return false;
      if (filterType === 'sprzedaz' && !typ.includes('sprzedaż')) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !(r['Dane Klienta'] || '').toLowerCase().includes(q) &&
        !(r['ulica'] || '').toLowerCase().includes(q) &&
        !(r['Numer oferty'] || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }).sort((a, b) => new Date(b['Data'] || 0) - new Date(a['Data'] || 0));

  // Summary stats
  const total = rows.length;
  const statusTotals = INQUIRY_STATUSES.reduce((acc, s) => {
    acc[s.value] = rows.filter(r => r._status?.status === s.value).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Zapytania agentów</h2>
        <button
          onClick={load}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: 'none', cursor: 'pointer' }}
        >
          ↻ Odśwież
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3 flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Łącznie</span>
          <span className="text-2xl font-bold font-mono">{total}</span>
        </div>
        {INQUIRY_STATUSES.slice(0, 3).map(s => (
          <div key={s.value} className="card p-3 flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</span>
            <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{statusTotals[s.value]}</span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
              {total ? Math.round(statusTotals[s.value] / total * 100) : 0}%
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="card px-3 py-2 text-sm appearance-none"
          style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <option value="">Wszyscy agenci</option>
          {agentNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="card px-3 py-2 text-sm appearance-none"
          style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <option value="">Wszystkie statusy</option>
          {INQUIRY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          <option value="_none">Bez statusu</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="card px-3 py-2 text-sm appearance-none"
          style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <option value="">Wszystkie typy</option>
          <option value="wynajem">Wynajem</option>
          <option value="sprzedaz">Sprzedaż</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj..."
          className="card px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)', outline: 'none' }}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-3)' }}>Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-3)' }}>Brak zapytań.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Agent', 'Data', 'Klient', 'Telefon', 'Nieruchomość', 'Typ', 'Źródło', 'Status', 'Komentarz'].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const s = INQUIRY_STATUSES.find(x => x.value === row._status?.status);
                const isWynajem = (row['Typ transakcji'] || '').toLowerCase().includes('wynajem');
                return (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <AgentAvatar name={row._agent} color={AGENT_COLORS[row._agent]} size={26} />
                        <span className="text-xs font-semibold">{row._agent}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono" style={{ color: 'var(--text-3)' }}>{row['Data']}</td>
                    <td className="p-3 text-xs font-semibold">{row['Dane Klienta'] || '—'}</td>
                    <td className="p-3">
                      {row['Telefon'] ? (
                        <a href={`tel:${row['Telefon']}`} className="text-xs font-mono" style={{ color: 'var(--green)' }}>
                          {row['Telefon']}
                        </a>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-medium">{row['ulica'] || '—'}</div>
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>{row['miasto']}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className="badge text-xs"
                        style={{ background: isWynajem ? '#EAF2FF' : '#FDEEE8', color: isWynajem ? '#378ADD' : '#D85A30' }}
                      >
                        {isWynajem ? 'Wynajem' : 'Sprzedaż'}
                      </span>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-3)' }}>{row['Źródło wiadomości'] || '—'}</td>
                    <td className="p-3">
                      {s ? (
                        <span className="badge text-xs" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-2)', maxWidth: 160 }}>
                      {row._status?.comment || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
