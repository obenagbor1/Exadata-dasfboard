import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable, HealthPill } from '../components/Widgets';

export default function Storage() {
  const { data: ts, loading: l1 } = usePolling(metrics.tablespaces, 60000);
  const { data: asm, loading: l2, error } = usePolling(metrics.asm, 60000);

  if (l1 || l2) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Storage &amp; ASM</h1>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">ASM Disk Groups</h2>
        <DataTable
          columns={[
            { key: 'diskgroup', label: 'Group' },
            { key: 'state', label: 'State' },
            { key: 'redundancy', label: 'Redundancy' },
            { key: 'total_gb', label: 'Total (GB)' },
            { key: 'used_gb', label: 'Used (GB)' },
            { key: 'free_gb', label: 'Free (GB)' },
            {
              key: 'used_pct',
              label: 'Used %',
              render: (v) => <HealthPill value={v} warn={80} crit={92} />,
            },
          ]}
          rows={asm || []}
        />
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Tablespaces</h2>
        <DataTable
          columns={[
            { key: 'tablespace_name', label: 'Name' },
            { key: 'total_mb', label: 'Total (MB)' },
            { key: 'used_mb', label: 'Used (MB)' },
            { key: 'free_mb', label: 'Free (MB)' },
            {
              key: 'used_pct',
              label: 'Used %',
              render: (v) => <HealthPill value={v} warn={80} crit={92} />,
            },
          ]}
          rows={ts || []}
        />
      </div>
    </div>
  );
}
