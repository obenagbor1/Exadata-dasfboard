import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';

export default function TopSql() {
  const { data, loading, error } = usePolling(metrics.topSql, 60000);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Top SQL by Elapsed Time</h1>
      <div className="card">
        <DataTable
          columns={[
            {
              key: 'sql_id',
              label: 'SQL ID',
              render: (v) => <code className="text-xs bg-slate-100 px-1 rounded">{v}</code>,
            },
            {
              key: 'sql_text',
              label: 'SQL',
              render: (v) => <span className="font-mono text-xs">{v}</span>,
            },
            { key: 'executions', label: 'Execs' },
            { key: 'elapsed_sec', label: 'Elapsed (s)' },
            { key: 'cpu_sec', label: 'CPU (s)' },
            { key: 'avg_elapsed_sec', label: 'Avg (s)' },
            { key: 'buffer_gets', label: 'Buffer Gets' },
            { key: 'disk_reads', label: 'Disk Reads' },
          ]}
          rows={data || []}
        />
      </div>
    </div>
  );
}
