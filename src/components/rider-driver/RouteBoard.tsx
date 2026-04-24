import { MapPinned, Navigation } from 'lucide-react';
import type { RiderDriverStop } from '@/lib/rider-driver/types';

export default function RouteBoard({ stops }: { stops: RiderDriverStop[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Route Planner</h2>
          <p className="mt-1 text-sm text-slate-300">Ordered stop sequence fed by the central dispatch flow.</p>
        </div>

        <div className="space-y-3">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
              <div
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full font-bold',
                  stop.status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : stop.status === 'current'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-200',
                ].join(' ')}
              >
                {stop.sequenceNo}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{stop.name}</div>
                <div className="text-sm text-slate-300">
                  {stop.address ?? '-'} • ETA: {stop.eta ?? '-'}
                </div>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                {stop.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Route Actions</h2>
          <p className="mt-1 text-sm text-slate-300">Navigation and route control shortcuts.</p>
        </div>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white">
            <Navigation className="h-4 w-4" />
            Start Navigation
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white">
            <MapPinned className="h-4 w-4" />
            Recalculate Route
          </button>
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
            Connect later to Mapbox or Google Maps for live GPS navigation and ETA updates.
          </div>
        </div>
      </section>
    </div>
  );
}
