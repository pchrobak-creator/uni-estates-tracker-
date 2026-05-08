import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, getWeekKey, aggregateEntries, formatNum } from '../utils';
import ProgressBar from '../components/ProgressBar';
import AgentAvatar from '../components/AgentAvatar';

export default function Leaderboard({ user, agents }) {
  const AGENT_COLORS = Object.fromEntries(agents.map(a => [a.name, a.color]));
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/entries?week=${getWeekKey(0)}`);
      setEntries(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const agentStats = agents.map(agent => {
    const stats = aggregateEntries(entries.filter(e => e.agent === agent.name));
    return { ...agent, ...stats };
  }).sort((a, b) => b.pozyski - a.pozyski || b.calls - a.calls);

  const maxCalls = Math.max(...agentStats.map(a => a.calls), 1);

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex flex-col gap-4 p-4 fade-in">
      <h2 className="text-lg font-bold">Ranking zespołu</h2>
      <p className="text-xs -mt-2" style={{ color: 'var(--text-3)' }}>Bieżący tydzień</p>

      <div className="flex flex-col gap-3">
        {agentStats.map((agent, i) => {
          const isMe = agent.name === user.name;
          return (
            <div
              key={agent.name}
              className="card p-4 flex items-center gap-3 transition-all"
              style={{
                borderColor: isMe ? (AGENT_COLORS[agent.name] || 'var(--green)') : 'var(--border)',
                borderWidth: isMe ? 2 : 1,
                background: isMe ? `${AGENT_COLORS[agent.name]}0D` : 'white',
              }}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                <span className="text-lg">
                  {i < 3 ? MEDALS[i] : (
                    <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-3)' }}>{i + 1}</span>
                  )}
                </span>
              </div>

              {/* Avatar */}
              <AgentAvatar name={agent.name} color={AGENT_COLORS[agent.name]} size={40} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{agent.name}</span>
                  {isMe && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${AGENT_COLORS[agent.name]}22`, color: AGENT_COLORS[agent.name] }}>
                      Ty
                    </span>
                  )}
                </div>
                <div className="mt-1.5">
                  <ProgressBar
                    value={agent.calls}
                    max={maxCalls}
                    color={AGENT_COLORS[agent.name] || 'var(--green)'}
                    height={4}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div
                      className="text-lg font-bold font-mono"
                      style={{ color: AGENT_COLORS[agent.name] || 'var(--green)' }}
                    >
                      {agent.pozyski}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-3)' }}>poz.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono">{agent.calls}</div>
                    <div className="text-xs" style={{ color: 'var(--text-3)' }}>tel.</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
