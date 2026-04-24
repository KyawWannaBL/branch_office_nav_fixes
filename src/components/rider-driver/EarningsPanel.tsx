import type { EarningsSummary } from '@/lib/rider-driver/types';

function Card({ title, value, tone = 'white' }: { title: string; value: string; tone?: 'white' | 'green' | 'red' | 'cyan' }) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-300'
      : tone === 'red'
      ? 'text-red-300'
      : tone === 'cyan'
      ? 'text-cyan-300'
      : 'text-white';

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <div className="text-sm text-slate-300">{title}</div>
      <div className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

function mmk(value: number) {
  return new Intl.NumberFormat('en-US').format(value) + ' MMK';
}

export default function EarningsPanel({ earnings }: { earnings: EarningsSummary | null }) {
  if (!earnings) {
    return <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-slate-300">No earnings data.</div>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Today Net" value={mmk(earnings.todayNet)} tone="green" />
      <Card title="Delivered Count" value={String(earnings.deliveredCount)} tone="cyan" />
      <Card title="Active Jobs" value={String(earnings.activeCount)} />
      <Card title="Failed Attempts" value={String(earnings.failedCount)} tone="red" />
    </div>
  );
}
