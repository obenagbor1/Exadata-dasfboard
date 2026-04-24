import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';

function LevelBadge({ value }) {
  const n = Number(value);
  let cls = 'bg-slate-100 text-slate-700';
  let label = `Level ${n}`;
  if (n <= 1) { cls = 'bg-red-100 text-red-700'; label = 'CRITICAL'; }
  else if (n <= 2) { cls = 'bg-red-100 text-red-700'; label = 'SEVERE'; }
  else if (n <= 8) { cls = 'bg-amber-100 text-amber-700'; label = 'ERROR'; }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export default function Alerts() {
  const { data, loading, error } = usePolling(metrics.alerts, 60000);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Recent Alert Log Entries</h1>
      <p className="text-sm text-slate-500">
        Last 24 hours, severity &le; 8. Sourced from <code>V$DIAG_ALERT_EXT</code>.
      </p>
      <div className="card">
        <DataTable
          columns={[
            {
              key: 'originating_timestamp',
              label: 'Time',
              render: (v) => v ? new Date(v).toLocaleString() : '—',
            },
            {
              key: 'message_level',
              label: 'Level',
              render: (v) => <LevelBadge value={v} />,
            },
            { key: 'message_type', label: 'Type' },
            { key: 'host_id', label: 'Host' },
            {
              key: 'message_text',
              label: 'Message',
              render: (v) => <span className="text-xs font-mono">{v}</span>,
            },
          ]}
          rows={data || []}
          emptyText="No recent critical alerts 🎉"
        />
      </div>
    </div>
  );
}
