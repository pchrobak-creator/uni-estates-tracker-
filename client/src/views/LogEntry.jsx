import React, { useState } from 'react';
import { apiFetch, getWeekKey, getQuarterKey } from '../utils';
import Toast from '../components/Toast';

export default function LogEntry({ user, agents, onSuccess }) {
  const isManager = user.role === 'manager';
  const [agent, setAgent] = useState(isManager ? (agents[0]?.name || '') : user.name);
  const [calls, setCalls] = useState('');
  const [scheduled, setScheduled] = useState('');
  const [done, setDone] = useState('');
  const [pozyski, setPozyski] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showReset, setShowReset] = useState(false);

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          agent,
          calls: Number(calls) || 0,
          scheduled: Number(scheduled) || 0,
          done: Number(done) || 0,
          pozyski: Number(pozyski) || 0,
          week: getWeekKey(0),
          quarter: getQuarterKey(),
          date: new Date().toISOString(),
        }),
      });
      setToast({ message: 'Zapisano!', type: 'success' });
      setCalls(''); setScheduled(''); setDone(''); setPozyski('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setToast({ message: err.message || 'Błąd zapisu', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      await apiFetch(`/api/entries/week?week=${getWeekKey(0)}`, { method: 'DELETE' });
      setToast({ message: 'Tydzień zresetowany', type: 'success' });
      setShowReset(false);
    } catch (err) {
      setToast({ message: err.message || 'Błąd', type: 'error' });
    }
  }

  const fields = [
    { id: 'calls', label: 'Telefony wychodzące', value: calls, set: setCalls, icon: '📞' },
    { id: 'scheduled', label: 'Umówione spotkania', value: scheduled, set: setScheduled, icon: '📅' },
    { id: 'done', label: 'Spotkania odbyły się', value: done, set: setDone, icon: '✅' },
    { id: 'pozyski', label: 'Pozyski', value: pozyski, set: setPozyski, icon: '🏠' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Wpisz działania</h2>
        <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{today}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Agent selector */}
        <div className="card p-4 flex flex-col gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Agent</label>
          {isManager ? (
            <select
              value={agent}
              onChange={e => setAgent(e.target.value)}
              className="w-full p-2 rounded-lg font-semibold text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              {agents.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: user.color || 'var(--green)' }}
              >
                {user.name?.[0]}
              </div>
              <span className="font-semibold">{user.name}</span>
            </div>
          )}
        </div>

        {/* Input fields */}
        {fields.map(f => (
          <div key={f.id} className="card p-4 flex items-center gap-4">
            <span className="text-2xl">{f.icon}</span>
            <div className="flex-1">
              <label
                htmlFor={f.id}
                className="text-xs font-semibold block mb-1"
                style={{ color: 'var(--text-3)' }}
              >
                {f.label}
              </label>
              <input
                id={f.id}
                type="number"
                min="0"
                max="999"
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder="0"
                className="w-full text-2xl font-bold font-mono"
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  padding: 0,
                }}
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-base"
          style={{ height: 52 }}
        >
          {loading ? 'Zapisuję...' : 'Zapisz działania'}
        </button>
      </form>

      {/* Manager-only reset */}
      {isManager && (
        <div className="mt-2">
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: '#FDEEE8',
                color: 'var(--coral)',
                border: '1px solid rgba(216,90,48,0.2)',
              }}
            >
              Resetuj bieżący tydzień
            </button>
          ) : (
            <div className="card p-4 flex flex-col gap-3" style={{ borderColor: 'rgba(216,90,48,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
                Usunąć wszystkie wpisy bieżącego tygodnia?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--coral)' }}
                >
                  Potwierdź reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
