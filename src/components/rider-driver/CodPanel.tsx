import { useMemo, useState } from 'react';
import type { CodRecord } from '@/lib/rider-driver/types';

function mmk(value: number) {
  return new Intl.NumberFormat('en-US').format(value) + ' MMK';
}

export default function CodPanel({
  codRecords,
  onSubmitHandover,
}: {
  codRecords: CodRecord[];
  onSubmitHandover: (amount: number, reference: string, notes?: string) => Promise<void>;
}) {
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingAmount = useMemo(
    () =>
      codRecords
        .filter((item) => item.status === 'pending_handover' || item.status === 'collected')
        .reduce((sum, item) => sum + item.amount, 0),
    [codRecords]
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">COD Ledger</h2>
          <p className="mt-1 text-sm text-slate-300">Collections synced for reconciliation.</p>
        </div>

        <div className="space-y-3">
          {codRecords.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-bold">{item.trackingNo}</div>
                <div className="text-sm text-slate-300">{item.collectedAt ?? '-'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-300">{mmk(item.amount)}</div>
                <div className="text-xs uppercase tracking-wide text-slate-300">{item.status}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">COD Handover</h2>
          <p className="mt-1 text-sm text-slate-300">Submit end-of-shift cash handover to finance.</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-slate-400">Pending Handover</div>
            <div className="mt-2 text-3xl font-black text-red-300">{mmk(pendingAmount)}</div>
          </div>

          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Handover reference"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmitHandover(pendingAmount, reference, notes);
                setReference('');
                setNotes('');
              } finally {
                setBusy(false);
              }
            }}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white"
          >
            Submit COD Handover
          </button>
        </div>
      </section>
    </div>
  );
}
