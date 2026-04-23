import React from 'react';

export default function MetricCard({ label, value, sub, trend, color }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span
        className="text-2xl font-bold font-mono leading-tight"
        style={{ color: color || 'var(--text)' }}
      >
        {value}
      </span>
      {(sub || trend != null) && (
        <div className="flex items-center gap-2 mt-0.5">
          {trend != null && (
            <span
              className="text-xs font-semibold"
              style={{ color: trend > 0 ? '#1D9E75' : trend < 0 ? '#D85A30' : 'var(--text-3)' }}
            >
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '–'} {Math.abs(trend)}
            </span>
          )}
          {sub && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
