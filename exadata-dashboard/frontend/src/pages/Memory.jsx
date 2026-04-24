import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Memory() {
  const { data: sga, loading: l1 } = usePolling(metrics.sga, 30000);
  const { data: pga, loading: l2, error } = usePolling(metrics.pga, 30000);

  if (l1 || l2) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  // Aggregate SGA for pie chart (instance 1 only for simplicity)
  const sgaForInstance = (sga || []).filter((r) => r.instance_number === 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Memory (SGA &amp; PGA)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">SGA Composition (Instance 1)</h2>
          {sgaForInstance.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sgaForInstance}
                  dataKey="size_mb"
                  nameKey="component"
                  outerRadius={90}
                  label={(e) => `${e.component}: ${e.size_mb} MB`}
                >
                  {sgaForInstance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-slate-500">No SGA data</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">PGA Statistics</h2>
          <DataTable
            columns={[
              { key: 'instance_number', label: 'Inst' },
              { key: 'metric', label: 'Metric' },
              { key: 'value_mb', label: 'MB' },
            ]}
            rows={pga || []}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Full SGA Breakdown (All Instances)</h2>
        <DataTable
          columns={[
            { key: 'instance_number', label: 'Inst' },
            { key: 'component', label: 'Component' },
            { key: 'size_mb', label: 'Size (MB)' },
          ]}
          rows={sga || []}
        />
      </div>
    </div>
  );
}
