import type { ReactNode } from 'react';
import {
  Bell,
  Bike,
  Truck,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import type { FieldRole, RiderDriverProfile } from '@/lib/rider-driver/types';

export type FieldTab =
  | 'jobs'
  | 'route'
  | 'pod'
  | 'cod'
  | 'earnings'
  | 'support';

export default function RiderDriverShell({
  role,
  profile,
  activeTab,
  onTabChange,
  onRefresh,
  children,
}: {
  role: FieldRole;
  profile: RiderDriverProfile | null;
  activeTab: FieldTab;
  onTabChange: (tab: FieldTab) => void;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const tabs: { key: FieldTab; label: string }[] = [
    { key: 'jobs', label: 'Jobs' },
    { key: 'route', label: 'Route' },
    { key: 'pod', label: 'POD' },
    { key: 'cod', label: 'COD' },
    { key: 'earnings', label: 'Earnings' },
    { key: 'support', label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f2d46_0%,#081120_42%,#050b16_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-3xl border border-cyan-400/20 bg-slate-950/60 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                {role === 'driver' ? <Truck className="h-7 w-7" /> : <Bike className="h-7 w-7" />}
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">Britium Express</div>
                <h1 className="text-2xl font-black tracking-wide">
                  {role === 'driver' ? 'Driver Operations' : 'Rider Operations'}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Supabase-connected field execution workspace
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs text-slate-300">User</div>
                <div className="mt-1 font-bold">{profile?.fullName ?? 'Field User'}</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs text-slate-300">Zone</div>
                <div className="mt-1 font-bold">{profile?.zone ?? '-'}</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs text-slate-300">Shift</div>
                <div className="mt-1 font-bold">{profile?.shiftName ?? '-'}</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="text-xs text-slate-300">Sync</div>
                <div className="mt-1 flex items-center gap-2 font-bold text-emerald-300">
                  <Wifi className="h-4 w-4" />
                  Online
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={[
                'rounded-2xl px-4 py-3 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onRefresh}
            className="ml-auto flex items-center gap-2 rounded-2xl bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
