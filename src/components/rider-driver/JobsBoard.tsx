import { Package, Phone, ScanLine, TriangleAlert } from 'lucide-react';
import type { RiderDriverJob } from '@/lib/rider-driver/types';

function Badge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
      {value}
    </span>
  );
}

export default function JobsBoard({
  jobs,
  selectedJob,
  onSelectJob,
  onMarkEnRoute,
  onMarkPickedUp,
}: {
  jobs: RiderDriverJob[];
  selectedJob: RiderDriverJob | null;
  onSelectJob: (job: RiderDriverJob) => void;
  onMarkEnRoute: (jobId: string) => void;
  onMarkPickedUp: (jobId: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Assigned Jobs</h2>
          <p className="mt-1 text-sm text-slate-300">Scan, call, update, and execute deliveries in order.</p>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelectJob(job)}
              className={[
                'w-full rounded-2xl border p-4 text-left transition',
                selectedJob?.id === job.id
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-bold">{job.trackingNo}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {job.customerName} • {job.address ?? '-'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge value={job.status} />
                  <Badge value={job.priority} />
                  <Badge value={job.township ?? 'Township'} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Selected Job</h2>
          <p className="mt-1 text-sm text-slate-300">Operational shortcuts for the current delivery.</p>
        </div>

        {selectedJob ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-lg font-bold">{selectedJob.trackingNo}</div>
              <div className="mt-1 text-sm text-slate-300">{selectedJob.customerName}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onMarkEnRoute(selectedJob.id)}
                className="rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-white"
              >
                Mark En Route
              </button>
              <button
                type="button"
                onClick={() => onMarkPickedUp(selectedJob.id)}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white"
              >
                Confirm Pickup
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                <Phone className="h-4 w-4" />
                Call Customer
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-bold text-white"
              >
                <ScanLine className="h-4 w-4" />
                Scan Parcel
              </button>
            </div>

            <div className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="h-4 w-4" />
                Exception flow
              </div>
              <p className="mt-2">
                If the receiver is unavailable, jump to the POD tab and submit a failed attempt with reason and notes.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-6 text-sm text-slate-300">
            Select a job to see execution actions.
          </div>
        )}
      </section>
    </div>
  );
}
