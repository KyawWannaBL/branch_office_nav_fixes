import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, ScanLine } from 'lucide-react';
import type { RiderDriverJob } from '@/lib/rider-driver/types';

export default function PodCapture({
  selectedJob,
  onSubmitProof,
  onSubmitFailedAttempt,
}: {
  selectedJob: RiderDriverJob | null;
  onSubmitProof: (payload: {
    jobId: string;
    trackingNo: string;
    proofMethod: 'signature' | 'photo' | 'otp' | 'qr';
    notes?: string;
    codCollected?: number;
    receiverName?: string;
  }) => Promise<void>;
  onSubmitFailedAttempt: (payload: { jobId: string; reason: string; notes?: string }) => Promise<void>;
}) {
  const [receiverName, setReceiverName] = useState('');
  const [codCollected, setCodCollected] = useState('');
  const [notes, setNotes] = useState('');
  const [failureReason, setFailureReason] = useState('Customer unavailable');
  const [busy, setBusy] = useState(false);

  if (!selectedJob) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <h2 className="text-xl font-bold">Proof of Delivery</h2>
        <p className="mt-2 text-sm text-slate-300">Select a job from Jobs first.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Proof of Delivery</h2>
          <p className="mt-1 text-sm text-slate-300">{selectedJob.trackingNo} • {selectedJob.customerName}</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-2xl bg-cyan-500 px-4 py-4 font-bold text-white">Scan Parcel</button>
            <button className="rounded-2xl bg-slate-800 px-4 py-4 font-bold text-white">Capture Signature</button>
            <button className="rounded-2xl bg-slate-800 px-4 py-4 font-bold text-white">Take POD Photo</button>
            <button className="rounded-2xl bg-slate-800 px-4 py-4 font-bold text-white">Verify OTP</button>
          </div>

          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-300">
            <Camera className="mx-auto mb-3 h-10 w-10 text-cyan-300" />
            Proof photo / signature capture area
          </div>

          <input
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            placeholder="Receiver name"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none"
          />
          <input
            value={codCollected}
            onChange={(e) => setCodCollected(e.target.value)}
            placeholder="COD collected"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery notes"
            className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmitProof({
                  jobId: selectedJob.id,
                  trackingNo: selectedJob.trackingNo,
                  proofMethod: 'photo',
                  notes,
                  receiverName,
                  codCollected: Number(codCollected || 0),
                });
                setReceiverName('');
                setCodCollected('');
                setNotes('');
              } finally {
                setBusy(false);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit POD
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Failed Attempt</h2>
          <p className="mt-1 text-sm text-slate-300">Use this when delivery could not be completed.</p>
        </div>

        <div className="space-y-4">
          <select
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none"
          >
            <option>Customer unavailable</option>
            <option>Wrong address</option>
            <option>Receiver refused parcel</option>
            <option>Payment issue</option>
            <option>Phone unreachable</option>
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Failure notes"
            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmitFailedAttempt({
                  jobId: selectedJob.id,
                  reason: failureReason,
                  notes,
                });
                setNotes('');
              } finally {
                setBusy(false);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-bold text-slate-950"
          >
            <AlertTriangle className="h-4 w-4" />
            Submit Failed Attempt
          </button>

          <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
            Enterprise Portal and customer tracking should see this status immediately after submission.
          </div>
        </div>
      </section>
    </div>
  );
}
