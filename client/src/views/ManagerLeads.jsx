import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils';
import AgentAvatar from '../components/AgentAvatar';

const LEAD_STATUSES = [
  { value: 'contacted',      label: 'Skontaktowano się', color: '#1D9E75', bg: '#E1F5EE' },
  { value: 'in_progress',    label: 'Działamy',          color: '#378ADD', bg: '#EAF2FF' },
  { value: 'no_contact',     label: 'Brak kontaktu',     color: '#BA7517', bg: '#FEF3E2' },
  { value: 'meeting_set',    label: 'Spotkanie',         color: '#7F77DD', bg: '#F0EFFF' },
  { value: 'signed',         label: 'Podpisano',         color: '#D4537E', bg: '#FCEEF4' },
  { value: 'not_interested', label: 'Niezainteresowany', color: '#9A9A94', bg: '#F0F0EE' },
];

export default function ManagerLeads({ agents }) {
  const AGENT_COLORS = Object.fromEntries(agents.map(a => [a.name, a.color]));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/leads/all');
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
    if (filterStatus === '_none' && r._status?.status) return false;
    if (filterStatus && filterStatus !== '_none' && r._status?.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(r['Imię i Nazwisko Klienta'] || '').toLowerCase().includes(q) &&
        !(r['Lokalizacja'] || '').toLowerCase().includes(q) &&
        !(r['Numer Oferty'] || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }).sort((a, b) => new Date(b['Data Utworzenia'] || 0) - new Date(a['Data Utworzenia'] || 0));

  // Pipeline kanban summary
  const pipeline = LEAD_STATUSES.map(s => ({
    ...s,
    count: rows.filter(r => r._status?.status === s.value).length,
  }));

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Leady agentów</h2>
        <button
          onClick={load}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: 'none', cursor: 'pointer' }}
        >
          ↻ Odśwież
        </button>
      </div>

      {/* Pipeline kanban row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pipeline.map(s => (
          <div
            key={s.value}
            className="card flex-shrink-0 px-3 py-2 flex flex-col items-center gap-0.5 min-w-[80px]"
            style={{ borderTop: `3px solid ${s.color}` }}
          >
            <span className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.count}</span>
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          <option value="_none">Bez statusu</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj..."
          className="card px-3 py-2 text-sm col-span-2 sm:col-span-1"
          style={{ border: '1px solid var(--border)', outline: 'none' }}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-3)' }}>Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-3)' }}>Brak leadów.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Agent', 'Data', 'Klient', 'Kontakt', 'Lokalizacja', 'Typ', 'Status', 'Komentarz'].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const s = LEAD_STATUSES.find(x => x.value === row._status?.status);
                return (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <AgentAvatar name={row._agent} color={AGENT_COLORS[row._agent]} size={26} />
                        <span className="text-xs font-semibold">{row._agent}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono" style={{ color: 'var(--text-3)' }}>{row['Data Utworzenia']}</td>
                    <td className="p-3 text-xs font-semibold">{row['Imię i Nazwisko Klienta'] || '—'}</td>
                    <td className="p-3">
                      {row['Dane Kontaktowe Klienta'] ? (
                        <a href={`tel:${row['Dane Kontaktowe Klienta']}`} className="text-xs font-mono" style={{ color: 'var(--green)' }}>
                          {row['Dane Kontaktowe Klienta']}
                        </a>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="p-3 text-xs">{row['Lokalizacja'] || '—'}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-3)' }}>
                      {row['Typ Leada'] || row['Rodzaj Transakcji'] || '—'}
                    </td>
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
