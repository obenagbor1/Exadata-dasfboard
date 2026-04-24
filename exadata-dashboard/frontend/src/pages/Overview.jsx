import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { StatCard, Loader, ErrorBox, DataTable, HealthPill } from '../components/Widgets';
import {
  Server, Users, HardDrive, AlertCircle, CheckCircle2, Cpu,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Overview() {
  const { data, loading, error } = usePolling(metrics.overview, 30000);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox error={error} />;
  if (!data)   return null;

  const db = data.database?.[0] || {};
  const instances = data.instances || [];
  const cpu = data.cpu || [];
  const sessions = data.sessions || [];
  const tablespaces = data.tablespaces_top || [];
  const asm = data.asm_diskgroups || [];
  const offload = data.offload?.[0] || {};
  const blockingCount = data.blocking_count || 0;

  const avgCpu = cpu.length
    ? (cpu.reduce((s, r) => s + (r.cpu_used_pct || 0), 0) / cpu.length).toFixed(1)
    : '0';
  const totalSessions = sessions.reduce((s, r) => s + (r.active_sessions || 0), 0);
  const allInstancesUp = instances.every((i) => i.status === 'OPEN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          {db.db_name || 'Database'} — {db.database_role || ''}
        </h1>
        <p className="text-sm text-slate-500">
          Open mode: {db.open_mode} · Protection: {db.protection_mode} ·
          Generated {new Date(data.generated_at).toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Instances Online"
          value={`${instances.filter(i => i.status === 'OPEN').length}/${instances.length}`}
          icon={Server}
          tone={allInstancesUp ? 'green' : 'red'}
        />
        <StatCard
          label="Avg CPU"
          value={avgCpu}
          suffix="%"
          icon={Cpu}
          tone={avgCpu > 85 ? 'red' : avgCpu > 70 ? 'amber' : 'green'}
        />
        <StatCard
          label="Active Sessions"
          value={totalSessions}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Blocking Sessions"
          value={blockingCount}
          icon={blockingCount > 0 ? AlertCircle : CheckCircle2}
          tone={blockingCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">CPU Utilisation by Instance</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cpu}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="instance_number" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cpu_used_pct" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">ASM Disk Groups</h2>
          <DataTable
            columns={[
              { key: 'diskgroup', label: 'Group' },
              { key: 'state', label: 'State' },
              { key: 'total_gb', label: 'Total (GB)' },
              {
                key: 'used_pct',
                label: 'Used',
                render: (v) => <HealthPill value={v} warn={80} crit={92} />,
              },
            ]}
            rows={asm}
          />
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Top Tablespaces by Usage</h2>
          <DataTable
            columns={[
              { key: 'tablespace_name', label: 'Tablespace' },
              { key: 'total_mb', label: 'Total (MB)' },
              {
                key: 'used_pct',
                label: 'Used',
                render: (v) => <HealthPill value={v} warn={80} crit={92} />,
              },
            ]}
            rows={tablespaces}
          />
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Exadata Smart Scan Offload</h2>
          {offload.offload_efficiency_pct !== undefined ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Offload Efficiency</span>
                <HealthPill
                  value={offload.offload_efficiency_pct}
                  warn={50} crit={30}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Eligible Data</span>
                <span>{offload.eligible_gb ?? '—'} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Returned via Interconnect</span>
                <span>{offload.returned_gb ?? '—'} GB</span>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                Higher % = more filtering pushed to Exadata storage cells.
              </p>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Smart Scan metrics unavailable (non-Exadata environment or insufficient privileges).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
