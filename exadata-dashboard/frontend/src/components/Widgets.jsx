import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export function StatCard({ label, value, suffix, icon: Icon, tone = 'slate' }) {
  const toneMap = {
    slate:  'text-slate-700',
    green:  'text-emerald-600',
    amber:  'text-amber-600',
    red:    'text-red-600',
    blue:   'text-brand-700',
  };
  return (
    <div className="card flex items-center justify-between">
      <div>
        <div className="stat-label">{label}</div>
        <div className={`stat-value ${toneMap[tone]}`}>
          {value}{suffix && <span className="text-sm ml-1">{suffix}</span>}
        </div>
      </div>
      {Icon && <Icon className={`w-8 h-8 ${toneMap[tone]} opacity-70`} />}
    </div>
  );
}

export function Loader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> {text}
    </div>
  );
}

export function ErrorBox({ error }) {
  return (
    <div className="card border-red-200 bg-red-50 flex gap-2 text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-medium">Failed to load data</div>
        <div className="text-sm">{error?.message || 'Unknown error'}</div>
      </div>
    </div>
  );
}

export function DataTable({ columns, rows, emptyText = 'No data' }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-slate-500 p-4">{emptyText}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            {columns.map((c) => (
              <th key={c.key} className="py-2 px-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="py-2 px-3 text-slate-700">
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pill-style status indicator (green/amber/red based on value vs thresholds) */
export function HealthPill({ value, warn = 75, crit = 90, suffix = '%' }) {
  const n = Number(value);
  let tone = 'bg-emerald-100 text-emerald-700';
  if (!isNaN(n) && n >= crit) tone = 'bg-red-100 text-red-700';
  else if (!isNaN(n) && n >= warn) tone = 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tone}`}>
      {value}{suffix}
    </span>
  );
}
