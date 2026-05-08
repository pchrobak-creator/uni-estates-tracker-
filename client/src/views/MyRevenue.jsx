import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, formatPLN, getRevenueQuarterKey, getQuarterLabel, statusBadge } from '../utils';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';

const QUARTERS = [
  { key: 'q2-2026', label: 'Q2 2026' },
  { key: 'q1-2026', label: 'Q1 2026' },
  { key: 'q4-2025', label: 'Q4 2025' },
  { key: 'q3-2025', label: 'Q3 2025' },
];

export default function MyRevenue({ user }) {
  const [quarter, setQuarter] = useState(getRevenueQuarterKey(0));
  const [allData, setAllData] = useState([]);

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch(`/api/revenue?quarter=${quarter}`);
      setAllData(rows);
    } catch {}
  }, [quarter]);

  useEffect(() => { load(); }, [load]);

  const myData = allData.find(r => r.agent === user.name) || { prowizja: 0, transakcje: 0 };
  const goal = user.goal || 75000;
  const pct = goal ? (myData.prowizja / goal) * 100 : 0;
  const sb = statusBadge(myData.prowizja, goal);

  // Rank among team
  const sorted = [...allData].sort((a, b) => b.prowizja - a.prowizja);
  const rank = sorted.findIndex(r => r.agent === user.name) + 1;
  const total = allData.reduce((s, r) => s + (r.prowizja || 0), 0);

  // Progress bar thresholds — placeholder until real agent thresholds from Sheets
  const thresholds = user.thresholds || [
    { limit: goal * 0.5,  label: 'Próg 1', pct: 3 },
    { limit: goal,        label: 'Próg 2', pct: 5 },
    { limit: goal * 1.5,  label: 'Próg 3', pct: 7 },
  ];

  const color = user.color || 'var(--green)';

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ background: color }}
        >
          {user.name?.[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Moje przychody</h2>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{user.name}</p>
        </div>
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          className="card px-3 py-2 text-sm font-medium appearance-none"
          style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          {QUARTERS.map(q => (
            <option key={q.key} value={q.key}>{q.label}</option>
          ))}
        </select>
      </div>

      {/* Goal progress */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">
            Cel kwartalny {getQuarterLabel(`${quarter.split('-')[0].toUpperCase()}-${quarter.split('-')[1]}`)}
          </span>
          <span
            className="badge"
            style={{ background: sb.bg, color: sb.color }}
          >
            {sb.label}
          </span>
        </div>
        <ProgressBar value={myData.prowizja} max={goal} color={color} height={12} />
        <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text-3)' }}>
          <span style={{ color, fontWeight: 700 }}>{formatPLN(myData.prowizja)}</span>
          <span>Cel: {formatPLN(goal)}</span>
        </div>
        <div className="text-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>
            {Math.round(pct)}%
          </span>
          <span className="text-sm ml-1" style={{ color: 'var(--text-3)' }}>celu</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Prowizja"
          value={formatPLN(myData.prowizja)}
          color={color}
        />
        <MetricCard
          label="Transakcje"
          value={myData.transakcje || 0}
          sub="w kwartale"
        />
        <MetricCard
          label="Miejsce w teamie"
          value={rank > 0 ? `#${rank}` : '—'}
          sub={`z ${allData.length} agentów`}
        />
        <MetricCard
          label="Udział w teamie"
          value={total > 0 ? `${Math.round((myData.prowizja / total) * 100)}%` : '0%'}
          sub="łącznych przychodów"
        />
      </div>

      {/* Bonus thresholds */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold">Progi bonusowe</p>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Progi zostaną zaktualizowane po podłączeniu arkusza WARUNKI BONUSÓW
        </p>
        {thresholds.map((t, i) => {
          const reached = myData.prowizja >= t.limit;
          const tPct = Math.min(100, (myData.prowizja / t.limit) * 100);
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: reached ? color : 'var(--text-3)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium">
                    {t.label} — {t.pct}% prowizji
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: reached ? color : 'var(--text-3)' }}>
                  {reached ? '✓ osiągnięty' : formatPLN(t.limit - myData.prowizja) + ' brakuje'}
                </span>
              </div>
              <ProgressBar
                value={tPct}
                max={100}
                color={reached ? color : '#CBD5E0'}
                height={5}
              />
            </div>
          );
        })}
      </div>

      {/* Transactions placeholder */}
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-sm font-semibold mb-1">Transakcje</p>
        {myData.transakcje > 0 ? (
          <div className="flex items-center justify-between py-3 rounded-xl" style={{ background: 'var(--bg)' }}>
            <span className="text-sm px-3" style={{ color: 'var(--text-2)' }}>
              Łącznie {myData.transakcje} transakcj{myData.transakcje === 1 ? 'a' : myData.transakcje < 5 ? 'e' : 'i'} — {getQuarterLabel(`${quarter.split('-')[0].toUpperCase()}-${quarter.split('-')[1]}`)}
            </span>
            <span className="text-xs px-3" style={{ color: 'var(--text-3)' }}>
              Szczegóły dostępne po podłączeniu arkusza
            </span>
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
            Brak transakcji w wybranym kwartale
          </p>
        )}
      </div>
    </div>
  );
}
