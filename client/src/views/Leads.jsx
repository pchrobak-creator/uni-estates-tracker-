import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';
import Toast from '../components/Toast';

const LEAD_STATUSES = [
  { value: 'contacted',      label: 'Skontaktowano się',      color: '#1D9E75', bg: '#E1F5EE' },
  { value: 'in_progress',    label: 'Działamy',               color: '#378ADD', bg: '#EAF2FF' },
  { value: 'no_contact',     label: 'Brak kontaktu',          color: '#BA7517', bg: '#FEF3E2' },
  { value: 'meeting_set',    label: 'Spotkanie umówione',     color: '#7F77DD', bg: '#F0EFFF' },
  { value: 'signed',         label: 'Podpisano umowę',        color: '#D4537E', bg: '#FCEEF4' },
  { value: 'not_interested', label: 'Niezainteresowany',      color: '#9A9A94', bg: '#F0F0EE' },
];

const PIPELINE_ORDER = ['contacted', 'in_progress', 'meeting_set', 'signed', 'no_contact', 'not_interested'];

function LeadCard({ row, agentName, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState(row._status?.comment || '');
  const [showComment, setShowComment] = useState(false);
  const currentStatus = row._status?.status || null;

  async function handleStatus(value) {
    setSaving(true);
    const prev = row._status;
    onStatusChange(row._key, value, comment);
    try {
      await apiFetch(`/api/leads/${agentName}/status`, {
        method: 'POST',
        body: JSON.stringify({ sheet_row_key: row._key, status: value, comment }),
      });
    } catch {
      onStatusChange(row._key, prev?.status || null, prev?.comment || '');
    } finally {
      setSaving(false);
    }
  }

  async function handleCommentBlur() {
    if (!currentStatus) return;
    await apiFetch(`/api/leads/${agentName}/status`, {
      method: 'POST',
      body: JSON.stringify({ sheet_row_key: row._key, status: currentStatus, comment }),
    }).catch(() => {});
  }

  const currentS = LEAD_STATUSES.find(s => s.value === currentStatus);

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">{row['Imię i Nazwisko Klienta'] || '—'}</span>
          {row['Dane Kontaktowe Klienta'] && (
            <a
              href={`tel:${row['Dane Kontaktowe Klienta']}`}
              className="text-xs font-mono"
              style={{ color: 'var(--green)' }}
            >
              {row['Dane Kontaktowe Klienta']}
            </a>
          )}
        </div>
        {currentS && (
          <span className="badge text-xs flex-shrink-0" style={{ background: currentS.bg, color: currentS.color }}>
            {currentS.label}
          </span>
        )}
      </div>

      {/* Lead details */}
      <div className="flex flex-col gap-0.5">
        {row['Lokalizacja'] && (
          <span className="text-sm font-medium">{row['Lokalizacja']}</span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {[row['Typ Nieruchomości'], row['Rodzaj Transakcji']].filter(Boolean).join(' · ')}
        </span>
        {row['Źródło'] && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Źródło: {row['Źródło']}</span>
        )}
      </div>

      {/* Comment / details */}
      {(row['Szczegóły'] || row['Ostatni Komentarz']) && (
        <p className="text-xs p-2 rounded-lg leading-relaxed" style={{ background: 'var(--bg)', color: 'var(--text-2)' }}>
          {row['Ostatni Komentarz'] || row['Szczegóły']}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {row['Numer Oferty'] && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>#{row['Numer Oferty']}</span>
        )}
        {row['Data Utworzenia'] && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{row['Data Utworzenia']}</span>
        )}
        {row['Typ Leada'] && (
          <span className="badge text-xs" style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>
            {row['Typ Leada']}
          </span>
        )}
      </div>

      {/* Status pills — 2x3 grid */}
      <div className="grid grid-cols-2 gap-2">
        {LEAD_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{
              minHeight: 40,
              background: currentStatus === s.value ? s.bg : 'var(--bg)',
              color: currentStatus === s.value ? s.color : 'var(--text-3)',
              border: `1.5px solid ${currentStatus === s.value ? s.color + '60' : 'var(--border)'}`,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {currentStatus === s.value && <span>✓</span>}
            {s.label}
          </button>
        ))}
      </div>

      {/* Comment */}
      <div>
        <button
          onClick={() => setShowComment(v => !v)}
          className="text-xs font-medium"
          style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {showComment ? '▲ Ukryj notatkę' : '▼ Dodaj notatkę'}
        </button>
        {showComment && (
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={handleCommentBlur}
            placeholder="Notatka..."
            rows={2}
            className="w-full mt-2 p-2 text-sm rounded-lg resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', outline: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

export default function Leads({ user }) {
  const [data, setData] = useState({ rows: [], notConfigured: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const touchStartY = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch(`/api/leads/${user.name}`);
      setData(result);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.name]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(key, status, comment) {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map(r =>
        r._key === key
          ? { ...r, _status: status ? { sheet_row_key: key, status, comment } : null }
          : r
      ),
    }));
  }

  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e) {
    if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 80) {
      load();
    }
    touchStartY.current = null;
  }

  const filtered = data.rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r['Imię i Nazwisko Klienta'] || '').toLowerCase().includes(q) ||
      (r['Lokalizacja'] || '').toLowerCase().includes(q) ||
      (r['Numer Oferty'] || '').toLowerCase().includes(q);
  }).sort((a, b) => new Date(b['Data Utworzenia'] || 0) - new Date(a['Data Utworzenia'] || 0));

  // Pipeline summary
  const pipeline = PIPELINE_ORDER.map(v => ({
    ...LEAD_STATUSES.find(s => s.value === v),
    count: data.rows.filter(r => r._status?.status === v).length,
  })).filter(s => s.count > 0);

  if (data.notConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3" style={{ color: 'var(--text-3)' }}>
        <span className="text-4xl">🎯</span>
        <p className="font-semibold text-center">Dane tego agenta nie są jeszcze podłączone.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 fade-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Leady</h2>
        <button
          onClick={load}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: 'none', cursor: 'pointer' }}
        >
          ↻ Odśwież
        </button>
      </div>

      {/* Pipeline summary */}
      {pipeline.length > 0 && (
        <div className="card p-3 flex gap-3 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
            Łącznie: {data.rows.length}
          </span>
          {pipeline.map(s => (
            <span key={s.value} className="text-xs font-medium" style={{ color: s.color }}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Szukaj po kliencie, lokalizacji, ID..."
        className="w-full px-4 py-2.5 rounded-xl text-sm"
        style={{ background: 'white', border: '1px solid var(--border)', outline: 'none' }}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 h-48 animate-pulse" style={{ background: '#f0f0ee' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2" style={{ color: 'var(--text-3)' }}>
          <span className="text-4xl">🎯</span>
          <p className="font-semibold">{search ? 'Brak wyników' : 'Brak leadów w tym arkuszu.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(row => (
            <LeadCard
              key={row._key}
              row={row}
              agentName={user.name}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
