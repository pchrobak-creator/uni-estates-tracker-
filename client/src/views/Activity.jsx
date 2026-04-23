import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import {
  apiFetch, getWeekKey, getQuarterKey, aggregateEntries, conversionRate, formatNum,
} from '../utils';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import AgentAvatar from '../components/AgentAvatar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AGENT_COLORS = {
  Hanna: '#1D9E75', Michał: '#378ADD', Nikolay: '#D85A30',
  Grzegorz: '#7F77DD', Piotr: '#BA7517', Mikołaj: '#D4537E',
};

export default function Activity({ agents }) {
  const [mode, setMode] = useState('week');
  const [entries, setEntries] = useState([]);
  const [prevEntries, setPrevEntries] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [cur, prev] = await Promise.all([
        apiFetch(mode === 'week'
          ? `/api/entries?week=${getWeekKey(0)}`
          : `/api/entries?quarter=${getQuarterKey()}`
        ),
        apiFetch(`/api/entries?week=${getWeekKey(-1)}`),
      ]);
      setEntries(cur);
      setPrevEntries(prev);
    } catch {}
  }, [mode]);

  useEffect(() => { loadData(); }, [loadData]);

  const agentNames = agents.map(a => a.name);

  function getAgentStats(name, data) {
    return aggregateEntries(data.filter(e => e.agent === name));
  }

  const totals = agentNames.reduce((acc, name) => {
    const s = getAgentStats(name, entries);
    return {
      calls: acc.calls + s.calls,
      scheduled: acc.scheduled + s.scheduled,
      done: acc.done + s.done,
      pozyski: acc.pozyski + s.pozyski,
    };
  }, { calls: 0, scheduled: 0, done: 0, pozyski: 0 });

  const prevTotals = agentNames.reduce((acc, name) => {
    const s = getAgentStats(name, prevEntries);
    return {
      calls: acc.calls + s.calls,
      scheduled: acc.scheduled + s.scheduled,
      done: acc.done + s.done,
      pozyski: acc.pozyski + s.pozyski,
    };
  }, { calls: 0, scheduled: 0, done: 0, pozyski: 0 });

  const agentRows = agentNames.map(name => {
    const cur = getAgentStats(name, entries);
    const prev = getAgentStats(name, prevEntries);
    return {
      name,
      color: AGENT_COLORS[name],
      ...cur,
      conv: conversionRate(cur.done, cur.calls),
      trend: cur.calls - prev.calls,
    };
  }).sort((a, b) => b.pozyski - a.pozyski || b.calls - a.calls);

  const maxCalls = Math.max(...agentRows.map(r => r.calls), 1);

  const chartData = {
    labels: agentRows.map(r => r.name),
    datasets: [
      {
        label: 'Telefony',
        data: agentRows.map(r => r.calls),
        backgroundColor: 'rgba(29,158,117,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Spotkania',
        data: agentRows.map(r => r.done),
        backgroundColor: 'rgba(55,138,221,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Pozyski',
        data: agentRows.map(r => r.pozyski),
        backgroundColor: 'rgba(216,90,48,0.7)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 11 }, padding: 12 } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'DM Mono', size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
    },
  };

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Aktywność</h2>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {['week', 'quarter'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: mode === m ? 'var(--green)' : 'white',
                color: mode === m ? 'white' : 'var(--text-3)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {m === 'week' ? 'Tydzień' : 'Kwartał'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Telefony"
          value={formatNum(totals.calls)}
          trend={mode === 'week' ? totals.calls - prevTotals.calls : undefined}
          sub={mode === 'week' ? 'vs poprzedni tydzień' : undefined}
        />
        <MetricCard
          label="Spotkania"
          value={formatNum(totals.done)}
          trend={mode === 'week' ? totals.done - prevTotals.done : undefined}
        />
        <MetricCard
          label="Pozyski"
          value={formatNum(totals.pozyski)}
          trend={mode === 'week' ? totals.pozyski - prevTotals.pozyski : undefined}
          color="var(--green)"
        />
        <MetricCard
          label="Konwersja"
          value={`${conversionRate(totals.done, totals.calls).toFixed(1)}%`}
          sub="spotkania / telefony"
        />
      </div>

      {/* Agent table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>#</th>
              <th className="text-left p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Agent</th>
              <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Tel.</th>
              <th className="text-right p-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>Spot.</th>
              <th className="text-right p-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Poz.</th>
              <th className="text-right p-3 text-xs font-semibold hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>Conv.</th>
            </tr>
          </thead>
          <tbody>
            {agentRows.map((row, i) => (
              <tr key={row.name} style={{ borderBottom: i < agentRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="p-3">
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-3)' }}>
                    {i === 0 ? '🥇' : i + 1}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <AgentAvatar name={row.name} color={row.color} size={26} />
                    <div>
                      <div className="font-semibold text-xs">{row.name}</div>
                      <ProgressBar value={row.calls} max={maxCalls} color={row.color} height={3} />
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <span className="font-mono font-bold text-xs">{row.calls}</span>
                  {mode === 'week' && row.trend !== 0 && (
                    <div className="text-xs" style={{ color: row.trend > 0 ? 'var(--green)' : 'var(--coral)' }}>
                      {row.trend > 0 ? '+' : ''}{row.trend}
                    </div>
                  )}
                </td>
                <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">{row.done}</td>
                <td className="p-3 text-right">
                  <span className="font-mono font-bold text-xs" style={{ color: row.pozyski > 0 ? 'var(--green)' : 'inherit' }}>
                    {row.pozyski}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">
                  {row.conv.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="card p-4">
        <p className="text-sm font-semibold mb-3">Aktywność agentów</p>
        <div style={{ height: 200 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
