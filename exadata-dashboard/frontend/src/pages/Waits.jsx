import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Waits() {
  const { data: topWaits, loading: l1 } = usePolling(metrics.topWaits, 30000);
  const { data: ash, loading: l2, error } = usePolling(metrics.ashWaits, 15000);

  if (l1 || l2) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  const topForChart = (topWaits || []).slice(0, 10).map((w) => ({
    event: w.event?.length > 25 ? w.event.substring(0, 25) + '…' : w.event,
    time: w.time_waited_sec,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Wait Events</h1>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Top 10 Wait Events (Time Waited)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topForChart} layout="vertical" margin={{ left: 140 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="event" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="time" fill="#ef4444" name="Seconds waited" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Active Session Activity (last 5 min, from ASH)
        </h2>
        <DataTable
          columns={[
            { key: 'session_state', label: 'State' },
            { key: 'wait_class', label: 'Wait Class' },
            { key: 'sample_count', label: 'Samples' },
          ]}
          rows={ash || []}
        />
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">System Events Detail</h2>
        <DataTable
          columns={[
            { key: 'event', label: 'Event' },
            { key: 'wait_class', label: 'Class' },
            { key: 'total_waits', label: 'Total Waits' },
            { key: 'time_waited_sec', label: 'Waited (s)' },
            { key: 'avg_wait_sec', label: 'Avg (s)' },
          ]}
          rows={topWaits || []}
        />
      </div>
    </div>
  );
}
