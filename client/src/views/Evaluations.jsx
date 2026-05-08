import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import {
  apiFetch, getWeekKey, getWeekLabel, aggregateEntries,
  conversionRate, evalScore, evalBadge, evalComment, formatNum,
} from '../utils';
import AgentAvatar from '../components/AgentAvatar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const WEEK_OPTIONS = [
  { offset: 0, label: 'Bieżący tydzień' },
  { offset: -1, label: 'Poprzedni tydzień' },
  { offset: -2, label: '2 tygodnie temu' },
];

export default function Evaluations({ agents }) {
  const AGENT_COLORS = Object.fromEntries(agents.map(a => [a.name, a.color]));
  const [weekOffset, setWeekOffset] = useState(0);
  const [allEntries, setAllEntries] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/entries/all');
      setAllEntries(data);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const weekKey = getWeekKey(weekOffset);
  const prevWeekKey = getWeekKey(weekOffset - 1);

  function getStats(name, wk) {
    return aggregateEntries(allEntries.filter(e => e.agent === name && e.week === wk));
  }

  function getHistory(name) {
    return Array.from({ length: 6 }, (_, i) => {
      const wk = getWeekKey(weekOffset - 5 + i);
      return getStats(name, wk).calls;
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex-1">Oceny agentów</h2>
        <select
          value={weekOffset}
          onChange={e => setWeekOffset(Number(e.target.value))}
          className="card px-3 py-2 text-sm font-medium appearance-none"
          style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          {WEEK_OPTIONS.map(o => (
            <option key={o.offset} value={o.offset}>{o.label}</option>
          ))}
        </select>
      </div>

      {agents.map(agent => {
        const stats = getStats(agent.name, weekKey);
        const prevStats = getStats(agent.name, prevWeekKey);
        const score = evalScore(stats, prevStats);
        const badge = evalBadge(score);
        const comment = evalComment(agent.name, stats, prevStats, score);
        const history = getHistory(agent.name);
        const maxH = Math.max(...history, 1);
        const conv = conversionRate(stats.done, stats.calls);

        const quarterKey = weekKey.slice(0, 4) + '-Q' + Math.ceil(
          (new Date(parseInt(weekKey.slice(0,4)), 0, 1 + (parseInt(weekKey.slice(6)) - 1) * 7).getMonth() + 1) / 3
        );
        const qPozyski = aggregateEntries(
          allEntries.filter(e => e.agent === agent.name && e.quarter === quarterKey)
        ).pozyski;

        const histChartData = {
          labels: history.map((_, i) => `W${weekOffset - 5 + i}`),
          datasets: [{
            data: history,
            backgroundColor: `${AGENT_COLORS[agent.name]}99`,
            borderRadius: 3,
          }],
        };
        const histChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            y: { display: false, beginAtZero: true },
            x: { display: false },
          },
        };

        return (
          <div key={agent.name} className="card p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <AgentAvatar name={agent.name} color={AGENT_COLORS[agent.name]} size={44} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{agent.name}</span>
                  <span
                    className="badge"
                    style={{ background: badge.bg, color: badge.color, fontSize: 11 }}
                  >
                    {badge.label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {getWeekLabel(weekKey)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono" style={{ color: badge.color }}>
                  {score}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>pkt</div>
              </div>
            </div>

            {/* Comment */}
            <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--text-2)' }}>
              {comment}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Telefony', value: stats.calls, delta: stats.calls - prevStats.calls },
                { label: 'Spotkania', value: stats.done, delta: stats.done - prevStats.done },
                { label: 'Pozyski', value: stats.pozyski, delta: stats.pozyski - prevStats.pozyski },
                { label: 'Poz. kw.', value: qPozyski, delta: null },
              ].map(({ label, value, delta }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-mono font-bold" style={{ color: AGENT_COLORS[agent.name] }}>
                    {value}
                  </span>
                  {delta !== null && delta !== 0 && (
                    <span className="text-xs" style={{ color: delta > 0 ? 'var(--green)' : 'var(--coral)' }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                  <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-3)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* History chart */}
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Historia telefonów (6 tygodni)</p>
              <div style={{ height: 48 }}>
                <Bar data={histChartData} options={histChartOptions} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
