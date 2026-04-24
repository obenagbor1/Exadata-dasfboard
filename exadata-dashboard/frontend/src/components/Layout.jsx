import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, HardDrive, Activity, Database,
  Zap, Archive, AlertTriangle, LogOut, Lock,
} from 'lucide-react';
import { auth } from '../services/api';

const navItems = [
  { to: '/',            label: 'Overview',      icon: LayoutDashboard },
  { to: '/cpu',         label: 'CPU & Sessions',icon: Cpu },
  { to: '/memory',      label: 'Memory',        icon: Database },
  { to: '/waits',       label: 'Wait Events',   icon: Activity },
  { to: '/storage',     label: 'Storage / ASM', icon: HardDrive },
  { to: '/sql',         label: 'Top SQL',       icon: Zap },
  { to: '/exadata',     label: 'Smart Scan',    icon: Zap },
  { to: '/backups',     label: 'Backups',       icon: Archive },
  { to: '/alerts',      label: 'Alerts',        icon: AlertTriangle },
  { to: '/blocking',    label: 'Blocking',      icon: Lock },
];

export default function Layout({ children }) {
  const nav = useNavigate();
  const handleLogout = () => {
    auth.logout();
    nav('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="text-lg font-semibold text-white">Exadata Monitor</div>
          <div className="text-xs text-slate-400">DBA Dashboard</div>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-800 ${
                  isActive ? 'bg-slate-800 text-white border-l-2 border-brand-500' : ''
                }`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 border-t border-slate-800 text-sm hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
