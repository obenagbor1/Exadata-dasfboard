import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function CpuSessions() {
  const { data: cpu, loading: l1 } = usePolling(metrics.cpu, 15000);
  const { data: sessions, loading: l2 } = usePolling(metrics.sessions, 15000);
  const { data: instances, loading: l3, error } = usePolling(metrics.instances, 30000);

  if (l1 || l2 || l3) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">CPU &amp; Sessions</h1>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Instance Status</h2>
        <DataTable
          columns={[
            { key: 'instance_number', label: '#' },
            { key: 'instance_name', label: 'Name' },
            { key: 'host_name', label: 'Host' },
            { key: 'version', label: 'Version' },
            { key: 'status', label: 'Status' },
            { key: 'uptime_hours', label: 'Uptime (hrs)' },
          ]}
          rows={instances || []}
        />
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Sessions by Instance</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sessions || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="instance_number" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="active_sessions"     name="Active"     fill="#10b981" />
            <Bar dataKey="inactive_sessions"   name="Inactive"   fill="#f59e0b" />
            <Bar dataKey="background_sessions" name="Background" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">CPU Utilisation</h2>
        <DataTable
          columns={[
            { key: 'instance_number', label: 'Instance' },
            { key: 'cpu_used_pct', label: 'CPU %' },
          ]}
          rows={cpu || []}
        />
      </div>
    </div>
  );
}
