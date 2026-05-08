import React from 'react';

const icons = {
  revenue: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  myrevenue: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  activity: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  evaluations: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
    </svg>
  ),
  log: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  stats: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/>
    </svg>
  ),
  leaderboard: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 21H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 .4-.8L12 3l8.6 5.7a1 1 0 0 1 .4.8V20a1 1 0 0 1-1 1h-4M12 21V12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  inquiries: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  leads: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function BottomNav({ tabs, active, onChange }) {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors"
          style={{
            color: active === tab.id ? 'var(--green)' : 'var(--text-3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {icons[tab.id]}
          <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
