import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import {
  apiFetch, getWeekKey, getQuarterKey, aggregateEntries, conversionRate, formatNum,
} from '../utils';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function MyStats({ user }) {
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/entries');
      setEntries(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentWeek = getWeekKey(0);
  const prevWeek = getWeekKey(-1);

  const cur = aggregateEntries(entries.filter(e => e.week === currentWeek));
  const prev = aggregateEntries(entries.filter(e => e.week === prevWeek));
  const qCur = getQuarterKey();
  const quarter = aggregateEntries(entries.filter(e => e.quarter === qCur));

  const history = Array.from({ length: 6 }, (_, i) => {
    const wk = getWeekKey(-5 + i);
    return aggregateEntries(entries.filter(e => e.week === wk)).calls;
  });

  const histChartData = {
    labels: Array.from({ length: 6 }, (_, i) => {
      const offset = -5 + i;
      return offset === 0 ? 'Ten' : `${offset}`;
    }),
    datasets: [{
      data: history,
      backgroundColor: Array.from({ length: 6 }, (_, i) =>
        i === 5 ? (user.color || '#1D9E75') : `${user.color || '#1D9E75'}55`
      ),
      borderRadius: 6,
    }],
  };

  const histChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.raw} telefonów` } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'DM Mono', size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
    },
  };

  const personalGoal = user.goal || 75000;
  const conv = conversionRate(cur.done, cur.calls);

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: user.color || 'var(--green)' }}
        >
          {user.name?.[0]}
        </div>
        <div>
          <h2 className="text-lg font-bold">{user.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Bieżący tydzień</p>
        </div>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Telefony" value={formatNum(cur.calls)} trend={cur.calls - prev.calls} sub="vs poprzedni" />
        <MetricCard label="Spotkania" value={formatNum(cur.done)} trend={cur.done - prev.done} />
        <MetricCard label="Pozyski" value={formatNum(cur.pozyski)} trend={cur.pozyski - prev.pozyski} color={user.color} />
        <MetricCard label="Konwersja" value={`${conv.toFixed(1)}%`} sub="spot. / telefony" />
      </div>

      {/* Calls history chart */}
      <div className="card p-4">
        <p className="text-sm font-semibold mb-3">Historia telefonów (6 tygodni)</p>
        <div style={{ height: 160 }}>
          <Bar data={histChartData} options={histChartOptions} />
        </div>
      </div>

      {/* Quarterly pozyski progress */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold">Pozyski kwartalne</p>
          <span className="font-mono text-sm font-bold" style={{ color: user.color || 'var(--green)' }}>
            {quarter.pozyski}
          </span>
        </div>
        <ProgressBar
          value={quarter.pozyski}
          max={Math.max(quarter.pozyski + 5, 20)}
          color={user.color || 'var(--green)'}
          height={8}
        />
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Kwartał {qCur} — łącznie {quarter.pozyski} pozysk{quarter.pozyski === 1 ? 'a' : 'ów'}
        </p>
      </div>
    </div>
  );
}
