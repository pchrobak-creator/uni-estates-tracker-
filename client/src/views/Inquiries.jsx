import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';
import Toast from '../components/Toast';

const INQUIRY_STATUSES = [
  { value: 'contacted',      label: 'Skontaktowano się',           color: '#1D9E75', bg: '#E1F5EE' },
  { value: 'in_progress',    label: 'Działamy',                    color: '#378ADD', bg: '#EAF2FF' },
  { value: 'no_contact',     label: 'Brak kontaktu',               color: '#BA7517', bg: '#FEF3E2' },
  { value: 'not_interested', label: 'Niezainteresowany',           color: '#9A9A94', bg: '#F0F0EE' },
];

function StatusBadge({ status }) {
  const s = INQUIRY_STATUSES.find(x => x.value === status);
  if (!s) return null;
  return (
    <span className="badge text-xs" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

function InquiryCard({ row, agentName, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState(row._status?.comment || '');
  const [showComment, setShowComment] = useState(false);
  const currentStatus = row._status?.status || null;

  async function handleStatus(value) {
    setSaving(true);
    const prev = row._status;
    onStatusChange(row._key, value, comment);
    try {
      await apiFetch(`/api/inquiries/${agentName}/status`, {
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
    await apiFetch(`/api/inquiries/${agentName}/status`, {
      method: 'POST',
      body: JSON.stringify({ sheet_row_key: row._key, status: currentStatus, comment }),
    }).catch(() => {});
  }

  const typ = row['Typ transakcji'] || '';
  const isWynajem = typ.toLowerCase().includes('wynajem');

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">{row['Dane Klienta'] || '—'}</span>
          {row['Telefon'] && (
            <a href={`tel:${row['Telefon']}`} className="text-xs font-mono" style={{ color: 'var(--green)' }}>
              {row['Telefon']}
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="badge text-xs"
            style={{ background: isWynajem ? '#EAF2FF' : '#FDEEE8', color: isWynajem ? '#378ADD' : '#D85A30' }}
          >
            {isWynajem ? 'Wynajem' : 'Sprzedaż'}
          </span>
          {currentStatus && <StatusBadge status={currentStatus} />}
        </div>
      </div>

      {/* Property */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{row['ulica'] || '—'}</span>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {[row['miasto'], row['Ilość pok.'] && `${row['Ilość pok.']} pok.`, row['metraż'] && `${row['metraż']} m²`]
            .filter(Boolean).join(' · ')}
        </span>
        {row['cena'] && (
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-2)' }}>
            {row['cena']}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {row['Źródło wiadomości'] && (
          <span className="badge text-xs" style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>
            {row['Źródło wiadomości']}
          </span>
        )}
        {row['Numer oferty'] && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
            #{row['Numer oferty']}
          </span>
        )}
        {row['Data'] && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{row['Data']}</span>
        )}
      </div>

      {/* Status pills */}
      <div className="grid grid-cols-2 gap-2">
        {INQUIRY_STATUSES.map(s => (
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

export default function Inquiries({ user }) {
  const [data, setData] = useState({ rows: [], notConfigured: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const touchStartY = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch(`/api/inquiries/${user.name}`);
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

  // Pull to refresh
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
    return (r['Dane Klienta'] || '').toLowerCase().includes(q) ||
      (r['Numer oferty'] || '').toLowerCase().includes(q) ||
      (r['ulica'] || '').toLowerCase().includes(q);
  }).sort((a, b) => new Date(b['Data'] || 0) - new Date(a['Data'] || 0));

  const statusCounts = INQUIRY_STATUSES.reduce((acc, s) => {
    acc[s.value] = data.rows.filter(r => r._status?.status === s.value).length;
    return acc;
  }, {});

  if (data.notConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3" style={{ color: 'var(--text-3)' }}>
        <span className="text-4xl">📋</span>
        <p className="font-semibold text-center">Dane tego agenta nie są jeszcze podłączone.</p>
        <p className="text-sm text-center">Skontaktuj się z administratorem.</p>
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
        <h2 className="text-lg font-bold flex-1">Zapytania</h2>
        <button
          onClick={load}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: 'none', cursor: 'pointer' }}
        >
          ↻ Odśwież
        </button>
      </div>

      {/* Summary bar */}
      {data.rows.length > 0 && (
        <div className="card p-3 flex gap-3 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
            Łącznie: {data.rows.length}
          </span>
          {INQUIRY_STATUSES.map(s => statusCounts[s.value] > 0 && (
            <span key={s.value} className="text-xs" style={{ color: s.color }}>
              {s.label}: {statusCounts[s.value]}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Szukaj po kliencie, adresie, ID oferty..."
        className="w-full px-4 py-2.5 rounded-xl text-sm"
        style={{ background: 'white', border: '1px solid var(--border)', outline: 'none' }}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 h-40 animate-pulse" style={{ background: '#f0f0ee' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2" style={{ color: 'var(--text-3)' }}>
          <span className="text-4xl">📭</span>
          <p className="font-semibold">{search ? 'Brak wyników' : 'Brak zapytań w tym arkuszu.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(row => (
            <InquiryCard
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
