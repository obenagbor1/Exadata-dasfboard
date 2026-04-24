import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';

function StatusBadge({ value }) {
  const map = {
    COMPLETED:  'bg-emerald-100 text-emerald-700',
    FAILED:     'bg-red-100 text-red-700',
    RUNNING:    'bg-blue-100 text-blue-700',
    'COMPLETED WITH WARNINGS': 'bg-amber-100 text-amber-700',
  };
  const cls = map[value] || 'bg-slate-100 text-slate-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{value}</span>;
}

export default function Backups() {
  const { data, loading, error } = usePolling(metrics.backups, 120000);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">RMAN Backup History</h1>
      <div className="card">
        <DataTable
          columns={[
            { key: 'session_key', label: 'Session' },
            { key: 'input_type', label: 'Type' },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge value={v} /> },
            {
              key: 'start_time',
              label: 'Started',
              render: (v) => v ? new Date(v).toLocaleString() : '—',
            },
            { key: 'elapsed_min', label: 'Duration (min)' },
            { key: 'input_gb', label: 'Input (GB)' },
            { key: 'output_gb', label: 'Output (GB)' },
          ]}
          rows={data || []}
          emptyText="No recent backup history"
        />
      </div>
    </div>
  );
}
