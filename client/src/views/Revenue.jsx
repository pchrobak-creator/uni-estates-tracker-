import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { apiFetch, formatPLN, formatNum, getRevenueQuarterKey, getQuarterLabel, statusBadge } from '../utils';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import AgentAvatar from '../components/AgentAvatar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TEAM_GOAL = 300000;

const QUARTERS = [
  { key: 'q2-2026', label: 'Q2 2026' },
  { key: 'q1-2026', label: 'Q1 2026' },
  { key: 'q4-2025', label: 'Q4 2025' },
  { key: 'q3-2025', label: 'Q3 2025' },
];

const OFFICES = ['Wszystkie', 'Warszawa', 'Kraków', 'Katowice'];

export default function Revenue({ agents, user }) {
  const [quarter, setQuarter] = useState(getRevenueQuarterKey(0));
  const [data, setData] = useState([]);
  const [sortKey, setSortKey] = useState('prowizja');
  const [sortDir, setSortDir] = useState(-1);
  const [office, setOffice] = useState(
    user?.role === 'superadmin' ? 'Wszystkie' : (user?.office || 'Warszawa')
  );

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch(`/api/revenue?quarter=${quarter}`);
      setData(rows);
    } catch {}
  }, [quarter]);

  useEffect(() => { load(); }, [load]);

  // Build lookup: agent name → color & goal from agents prop
  const agentMap = Object.fromEntries(agents.map(a => [a.name, a]));

  // Filter by office if needed
  const filtered = office === 'Wszystkie'
    ? data
    : data.filter(r => {
        const a = agentMap[r.agent];
        return a ? a.office === office : true;
      });

  const sorted = [...filtered].sort((a, b) => sortDir * (b[sortKey] - a[sortKey]));
  const total = filtered.reduce((s, r) => s + (r.prowizja || 0), 0);
  const totalTx = filtered.reduce((s, r) => s + (r.transakcje || 0), 0);
  const goalPct = total / TEAM_GOAL * 100;
  const leader = sorted[0];

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  const chartData = {
    labels: sorted.map(r => r.agent),
    datasets: [
      {
        label: 'Prowizja (PLN)',
        data: sorted.map(r => r.prowizja),
        backgroundColor: sorted.map(r => agentMap[r.agent]?.color || '#9A9A94'),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ' ' + formatPLN(ctx.raw) } },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: v => formatNum(v) + ' zł', font: { family: 'DM Mono', size: 11 } },
      },
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
    },
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      {/* Header + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-bold flex-1">Przychody</h2>
        {isSuperAdmin && (
          <select
            value={office}
            onChange={e => setOffice(e.target.value)}
            className="card px-3 py-2 text-sm font-medium appearance-none"
            style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            {OFFICES.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}
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

      {/* Team goal bar */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">
            Cel {office !== 'Wszystkie' ? office : 'wszystkich oddziałów'} &nbsp;
            {getQuarterLabel(`${quarter.split('-')[0].toUpperCase()}-${quarter.split('-')[1]}`)}
          </span>
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--green)' }}>
            {Math.round(goalPct)}%
          </span>
        </div>
        <ProgressBar value={total} max={TEAM_GOAL} color="var(--green)" height={10} />
        <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text-3)' }}>
          <span>{formatPLN(total)}</span>
          <span>Cel: {formatPLN(TEAM_GOAL)}</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Łączne przychody" value={formatPLN(total)} color="var(--green)" />
        <MetricCard label="% celu" value={`${Math.round(goalPct)}%`} color={goalPct >= 100 ? 'var(--green)' : goalPct >= 70 ? '#378ADD' : 'var(--coral)'} />
        <MetricCard label="Lider" value={leader?.agent || '—'} sub={leader ? formatPLN(leader.prowizja) : ''} />
        <MetricCard label="Transakcje" value={formatNum(totalTx)} sub="łącznie" />
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-3)' }}>
          <p className="text-4xl mb-2">📊</p>
          <p className="font-medium">Brak danych</p>
          <p className="text-sm">Brak wpisów dla wybranego okresu</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left p-3 font-semibold text-xs" style={{ color: 'var(--text-3)' }}>#</th>
                  <th className="text-left p-3 font-semibold text-xs" style={{ color: 'var(--text-3)' }}>Agent</th>
                  <th
                    className="text-right p-3 font-semibold text-xs cursor-pointer select-none"
                    style={{ color: sortKey === 'prowizja' ? 'var(--green)' : 'var(--text-3)' }}
                    onClick={() => handleSort('prowizja')}
                  >
                    Prowizja {sortKey === 'prowizja' ? (sortDir < 0 ? '↓' : '↑') : ''}
                  </th>
                  <th
                    className="text-right p-3 font-semibold text-xs cursor-pointer select-none hidden sm:table-cell"
                    style={{ color: sortKey === 'transakcje' ? 'var(--green)' : 'var(--text-3)' }}
                    onClick={() => handleSort('transakcje')}
                  >
                    Transakcje {sortKey === 'transakcje' ? (sortDir < 0 ? '↓' : '↑') : ''}
                  </th>
                  <th className="text-right p-3 font-semibold text-xs" style={{ color: 'var(--text-3)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const agentInfo = agentMap[row.agent];
                  const agentGoal = agentInfo?.goal || 75000;
                  const agentColor = agentInfo?.color || '#9A9A94';
                  const sb = statusBadge(row.prowizja, agentGoal);
                  const barPct = Math.min(100, (row.prowizja / (sorted[0]?.prowizja || 1)) * 100);
                  return (
                    <tr key={row.id} style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td className="p-3">
                        <span className="font-mono font-bold text-xs" style={{ color: 'var(--text-3)' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <AgentAvatar name={row.agent} color={agentColor} size={28} />
                          <div>
                            <div className="font-semibold text-xs">{row.agent}</div>
                            {isSuperAdmin && agentInfo?.office && (
                              <div className="text-xs" style={{ color: 'var(--text-3)' }}>{agentInfo.office}</div>
                            )}
                            <div className="mt-1">
                              <ProgressBar value={barPct} max={100} color={agentColor} height={4} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-xs">{formatPLN(row.prowizja)}</span>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {Math.round(row.prowizja / agentGoal * 100)}% celu ind.
                        </div>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        <span className="font-mono font-semibold">{row.transakcje}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="badge text-xs" style={{ background: sb.bg, color: sb.color }}>
                          {sb.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold mb-3">Przychody agentów</p>
            <div style={{ height: 200 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
