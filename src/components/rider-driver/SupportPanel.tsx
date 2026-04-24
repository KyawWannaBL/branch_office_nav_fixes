import { useState } from 'react';

export default function SupportPanel({
  onSubmit,
}: {
  onSubmit: (subject: string, details: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState('Route issue');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Raise Support Ticket</h2>
          <p className="mt-1 text-sm text-slate-300">Escalate issues directly to operations support.</p>
        </div>

        <div className="space-y-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white outline-none"
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Support details"
            className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(subject, details);
                setDetails('');
              } finally {
                setBusy(false);
              }
            }}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white"
          >
            Submit Support Ticket
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Operational Guidance</h2>
          <p className="mt-1 text-sm text-slate-300">Suggested escalation matrix for field issues.</p>
        </div>

        <ul className="space-y-3 text-sm text-slate-200">
          <li className="rounded-2xl bg-white/5 p-4">Customer unreachable → mark failed attempt and attach note.</li>
          <li className="rounded-2xl bg-white/5 p-4">Payment mismatch → pause delivery, escalate to finance/support.</li>
          <li className="rounded-2xl bg-white/5 p-4">Address error → request route correction from branch office.</li>
          <li className="rounded-2xl bg-white/5 p-4">Parcel damage → photo evidence first, then escalate.</li>
        </ul>
      </section>
    </div>
  );
}
