import React, { useState, useCallback } from 'react';
import { apiFetch } from '../utils';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKey = useCallback(async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (k === '') return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setLoading(true);
      try {
        const user = await apiFetch('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ pin: next }),
        });
        sessionStorage.setItem('pin', next);
        sessionStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
      } catch {
        setError('Nieprawidłowy PIN');
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); setError(''); }, 600);
      } finally {
        setLoading(false);
      }
    }
  }, [pin, onLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <span className="text-white text-2xl font-bold">UE</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Uni Estates</h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Warsaw Tracker</p>
          </div>
        </div>

        <div className={shake ? 'shake' : ''}>
          <div className="flex gap-3 justify-center mb-2">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className="w-4 h-4 rounded-full transition-all duration-150"
                style={{
                  background: i < pin.length ? 'var(--green)' : 'rgba(0,0,0,0.12)',
                  transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          {error && <p className="text-center text-sm font-medium" style={{ color: 'var(--coral)' }}>{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full" style={{ opacity: loading ? 0.5 : 1 }}>
          {KEYS.map((k, i) => (
            <button
              key={i}
              onClick={() => handleKey(k)}
              disabled={loading || k === ''}
              className="flex items-center justify-center rounded-2xl font-semibold text-xl transition-all active:scale-95"
              style={{
                height: 64,
                background: k === '' ? 'transparent' : 'white',
                color: k === '⌫' ? 'var(--text-3)' : 'var(--text)',
                border: k === '' ? 'none' : '1px solid var(--border)',
                cursor: k === '' ? 'default' : 'pointer',
                boxShadow: k === '' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>Wpisz 4-cyfrowy PIN</p>
      </div>
    </div>
  );
}
