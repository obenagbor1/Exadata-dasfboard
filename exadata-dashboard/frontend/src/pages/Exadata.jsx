import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, StatCard, DataTable } from '../components/Widgets';
import { Zap, HardDrive, Gauge } from 'lucide-react';

export default function Exadata() {
  const { data: off, loading: l1 } = usePolling(metrics.offload, 60000);
  const { data: flash, loading: l2, error } = usePolling(metrics.flashCache, 60000);

  if (l1 || l2) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  const o = off?.[0] || {};
  const hasData = o.offload_efficiency_pct !== undefined && o.offload_efficiency_pct !== null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Exadata Smart Scan &amp; Flash Cache</h1>

      {!hasData ? (
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Smart Scan metrics are not available. This can happen on non-Exadata environments,
            or when the monitoring user lacks privileges to read <code>V$SYSSTAT</code> cell metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Offload Efficiency"
            value={o.offload_efficiency_pct}
            suffix="%"
            icon={Gauge}
            tone={o.offload_efficiency_pct > 70 ? 'green' : o.offload_efficiency_pct > 40 ? 'amber' : 'red'}
          />
          <StatCard
            label="Eligible Data"
            value={o.eligible_gb}
            suffix="GB"
            icon={HardDrive}
            tone="blue"
          />
          <StatCard
            label="Interconnect Returned"
            value={o.returned_gb}
            suffix="GB"
            icon={Zap}
            tone="blue"
          />
        </div>
      )}

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Flash Cache Statistics</h2>
        <DataTable
          columns={[
            { key: 'metric', label: 'Metric' },
            { key: 'value_gb', label: 'Value (GB)' },
          ]}
          rows={flash || []}
        />
        <p className="text-xs text-slate-500 mt-3">
          The <em>cell flash cache read hits</em> ratio vs total reads indicates how effectively
          your workload is served by the Exadata Smart Flash Cache layer. Higher hit rates
          reduce latency significantly on OLTP-style queries.
        </p>
      </div>
    </div>
  );
}
