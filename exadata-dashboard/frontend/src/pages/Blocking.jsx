import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { metrics } from '../services/api';
import { Loader, ErrorBox, DataTable } from '../components/Widgets';
import { Lock } from 'lucide-react';

export default function Blocking() {
  const { data, loading, error } = usePolling(metrics.blocking, 10000);
  if (loading) return <Loader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
        <Lock className="w-5 h-5" /> Blocking Sessions
      </h1>
      <div className="card">
        {(!data || data.length === 0) ? (
          <div className="text-sm text-emerald-600 font-medium py-2">
            ✓ No blocking sessions detected.
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'blocker_inst',    label: 'Blocker Inst' },
              { key: 'blocker_sid',     label: 'Blocker SID' },
              { key: 'blocker_user',    label: 'Blocker User' },
              { key: 'blocker_machine', label: 'Blocker Host' },
              { key: 'waiter_inst',     label: 'Waiter Inst' },
              { key: 'waiter_sid',      label: 'Waiter SID' },
              { key: 'waiter_user',     label: 'Waiter User' },
              { key: 'waiter_event',    label: 'Waiting On' },
              {
                key: 'seconds_in_wait',
                label: 'Seconds Waiting',
                render: (v) => (
                  <span className={v > 60 ? 'text-red-600 font-medium' : 'text-slate-700'}>
                    {v}
                  </span>
                ),
              },
            ]}
            rows={data}
          />
        )}
      </div>
    </div>
  );
}
