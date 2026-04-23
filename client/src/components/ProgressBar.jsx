import React from 'react';

export default function ProgressBar({ value, max, color = '#1D9E75', height = 8, showLabel = false }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: 'rgba(0,0,0,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
            {Math.round(pct)}%
          </span>
        </div>
      )}
    </div>
  );
}
