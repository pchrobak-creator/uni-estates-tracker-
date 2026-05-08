import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import Revenue from './views/Revenue';
import Activity from './views/Activity';
import Evaluations from './views/Evaluations';
import LogEntry from './views/LogEntry';
import MyStats from './views/MyStats';
import Leaderboard from './views/Leaderboard';
import Inquiries from './views/Inquiries';
import Leads from './views/Leads';
import ManagerInquiries from './views/ManagerInquiries';
import ManagerLeads from './views/ManagerLeads';
import MyRevenue from './views/MyRevenue';
import { apiFetch } from './utils';

const SUPERADMIN_TABS = [
  { id: 'revenue',     label: 'Przychody' },
  { id: 'activity',    label: 'Aktywność' },
  { id: 'inquiries',   label: 'Zapytania' },
  { id: 'leads',       label: 'Leady' },
  { id: 'log',         label: 'Wpis' },
];

const MANAGER_TABS = [
  { id: 'revenue',     label: 'Przychody' },
  { id: 'activity',    label: 'Aktywność' },
  { id: 'evaluations', label: 'Oceny' },
  { id: 'inquiries',   label: 'Zapytania' },
  { id: 'leads',       label: 'Leady' },
  { id: 'log',         label: 'Wpis' },
];

const AGENT_TABS = [
  { id: 'myrevenue',   label: 'Przychody' },
  { id: 'stats',       label: 'Wyniki' },
  { id: 'leaderboard', label: 'Ranking' },
  { id: 'inquiries',   label: 'Zapytania' },
  { id: 'leads',       label: 'Leady' },
  { id: 'log',         label: 'Wpis' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  });
  const [tab, setTab] = useState(null);
  const [agents, setAgents] = useState([]);

  const loadAgents = useCallback(async () => {
    try {
      const data = await apiFetch('/api/agents');
      setAgents(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      loadAgents();
      setTab(user.role === 'agent' ? 'myrevenue' : 'revenue');
    }
  }, [user, loadAgents]);

  function handleLogin(u) {
    setUser(u);
  }

  function handleLogout() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('pin');
    setUser(null);
    setTab(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  const isSuperAdmin = user.role === 'superadmin';
  const isManager    = user.role === 'manager';
  const isAgent      = user.role === 'agent';
  const hasManagerAccess = isSuperAdmin || isManager;

  const tabs = isSuperAdmin ? SUPERADMIN_TABS : isManager ? MANAGER_TABS : AGENT_TABS;

  function renderView() {
    switch (tab) {
      case 'revenue':     return <Revenue agents={agents} user={user} />;
      case 'activity':    return <Activity agents={agents} user={user} />;
      case 'evaluations': return <Evaluations agents={agents} user={user} />;
      case 'inquiries':   return hasManagerAccess ? <ManagerInquiries agents={agents} user={user} /> : <Inquiries user={user} />;
      case 'leads':       return hasManagerAccess ? <ManagerLeads agents={agents} user={user} /> : <Leads user={user} />;
      case 'log':         return <LogEntry user={user} agents={agents} />;
      case 'myrevenue':   return <MyRevenue user={user} />;
      case 'stats':       return <MyStats user={user} />;
      case 'leaderboard': return <Leaderboard user={user} agents={agents} />;
      default:            return null;
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 px-4 flex items-center gap-3"
        style={{
          height: 56,
          background: 'white',
          borderBottom: '1px solid var(--border)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--green)' }}
        >
          UE
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">Uni Estates</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>
            {user.name || ''}{user.office ? ` · ${user.office}` : ''}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.id ? 'var(--green-light)' : 'transparent',
                color: tab === t.id ? 'var(--green)' : 'var(--text-3)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: 'none', cursor: 'pointer' }}
        >
          Wyloguj
        </button>
      </header>

      <main
        className="max-w-3xl mx-auto content-with-bottom-nav md:pb-6"
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        {renderView()}
      </main>

      <div className="md:hidden">
        <BottomNav tabs={tabs} active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
