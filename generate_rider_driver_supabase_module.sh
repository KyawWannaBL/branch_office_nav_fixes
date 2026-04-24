#!/usr/bin/env bash
set -euo pipefail

cd /d/branch_office_nav_fixes

mkdir -p src/lib/rider-driver
mkdir -p src/components/rider-driver
mkdir -p src/pages

cat > src/lib/rider-driver/types.ts <<'EOF'
export type FieldRole = 'rider' | 'driver';

export type JobStatus =
  | 'assigned'
  | 'en_route'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_attempt'
  | 'returned'
  | 'exception';

export type ProofMethod = 'signature' | 'photo' | 'otp' | 'qr';

export type RiderDriverProfile = {
  id: string;
  role: FieldRole;
  fullName: string;
  phone?: string | null;
  zone?: string | null;
  shiftName?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
};

export type RiderDriverJob = {
  id: string;
  trackingNo: string;
  customerName: string;
  customerPhone?: string | null;
  merchantName?: string | null;
  township?: string | null;
  address?: string | null;
  codAmount: number;
  status: JobStatus;
  priority: 'high' | 'normal';
  eta?: string | null;
  sequenceNo?: number | null;
  assignedTo?: string | null;
};

export type RiderDriverStop = {
  id: string;
  jobId?: string | null;
  name: string;
  address?: string | null;
  eta?: string | null;
  sequenceNo: number;
  status: 'completed' | 'current' | 'upcoming';
};

export type CodRecord = {
  id: string;
  trackingNo: string;
  amount: number;
  status: 'collected' | 'pending_handover' | 'handed_over';
  collectedAt?: string | null;
};

export type EarningsSummary = {
  deliveredCount: number;
  failedCount: number;
  activeCount: number;
  collectedCod: number;
  pendingHandover: number;
  handedOver: number;
  todayNet: number;
};

export type ProofPayload = {
  jobId: string;
  trackingNo: string;
  proofMethod: ProofMethod;
  notes?: string;
  codCollected?: number;
  receiverName?: string;
  photoUrl?: string | null;
  signatureDataUrl?: string | null;
};

export type ExceptionPayload = {
  jobId: string;
  reason: string;
  notes?: string;
};

export type HandoverPayload = {
  amount: number;
  reference: string;
  notes?: string;
};
EOF

cat > src/lib/rider-driver/api.ts <<'EOF'
import { supabase } from '@/lib/supabase';
import type {
  CodRecord,
  EarningsSummary,
  ExceptionPayload,
  FieldRole,
  HandoverPayload,
  ProofPayload,
  RiderDriverJob,
  RiderDriverProfile,
  RiderDriverStop,
} from './types';

const jobSelect = `
  id,
  tracking_no,
  customer_name,
  customer_phone,
  merchant_name,
  township,
  address,
  cod_amount,
  status,
  priority,
  eta,
  sequence_no,
  assigned_to
`;

function mapRole(value?: string | null): FieldRole {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-') === 'driver'
    ? 'driver'
    : 'rider';
}

export async function getMyFieldProfile(userId: string): Promise<RiderDriverProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, zone, shift_name, vehicle_type, vehicle_plate')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    role: mapRole(data.role),
    fullName: data.full_name ?? 'Britium Field User',
    phone: data.phone ?? null,
    zone: data.zone ?? null,
    shiftName: data.shift_name ?? null,
    vehicleType: data.vehicle_type ?? null,
    vehiclePlate: data.vehicle_plate ?? null,
  };
}

export async function getAssignedJobs(userId: string): Promise<RiderDriverJob[]> {
  const { data, error } = await supabase
    .from('shipments')
    .select(jobSelect)
    .eq('assigned_to', userId)
    .order('sequence_no', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    trackingNo: row.tracking_no,
    customerName: row.customer_name ?? 'Customer',
    customerPhone: row.customer_phone ?? null,
    merchantName: row.merchant_name ?? null,
    township: row.township ?? null,
    address: row.address ?? null,
    codAmount: Number(row.cod_amount ?? 0),
    status: row.status ?? 'assigned',
    priority: row.priority === 'high' ? 'high' : 'normal',
    eta: row.eta ?? null,
    sequenceNo: row.sequence_no ?? null,
    assignedTo: row.assigned_to ?? null,
  }));
}

export async function getRouteStops(userId: string): Promise<RiderDriverStop[]> {
  const { data, error } = await supabase
    .from('route_stops')
    .select('id, job_id, name, address, eta, sequence_no, status, assigned_to')
    .eq('assigned_to', userId)
    .order('sequence_no', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    jobId: row.job_id ?? null,
    name: row.name ?? 'Stop',
    address: row.address ?? null,
    eta: row.eta ?? null,
    sequenceNo: Number(row.sequence_no ?? 0),
    status: row.status ?? 'upcoming',
  }));
}

export async function getCodRecords(userId: string): Promise<CodRecord[]> {
  const { data, error } = await supabase
    .from('cod_collections')
    .select('id, tracking_no, amount, status, collected_at, rider_id')
    .eq('rider_id', userId)
    .order('collected_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    trackingNo: row.tracking_no,
    amount: Number(row.amount ?? 0),
    status: row.status ?? 'collected',
    collectedAt: row.collected_at ?? null,
  }));
}

export async function getEarningsSummary(userId: string): Promise<EarningsSummary> {
  const jobs = await getAssignedJobs(userId);
  const cod = await getCodRecords(userId);

  const deliveredCount = jobs.filter((j) => j.status === 'delivered').length;
  const failedCount = jobs.filter((j) => j.status === 'failed_attempt').length;
  const activeCount = jobs.filter((j) =>
    ['assigned', 'en_route', 'picked_up', 'out_for_delivery'].includes(j.status)
  ).length;

  const collectedCod = cod.reduce((sum, item) => sum + item.amount, 0);
  const pendingHandover = cod
    .filter((item) => item.status === 'pending_handover')
    .reduce((sum, item) => sum + item.amount, 0);
  const handedOver = cod
    .filter((item) => item.status === 'handed_over')
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    deliveredCount,
    failedCount,
    activeCount,
    collectedCod,
    pendingHandover,
    handedOver,
    todayNet: deliveredCount * 2000 + activeCount * 500,
  };
}

export async function updateJobStatus(jobId: string, status: string, notes?: string) {
  const { error } = await supabase
    .from('shipments')
    .update({
      status,
      latest_note: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) throw error;
}

export async function submitProof(payload: ProofPayload) {
  const { error } = await supabase.from('delivery_proofs').insert({
    job_id: payload.jobId,
    tracking_no: payload.trackingNo,
    proof_method: payload.proofMethod,
    notes: payload.notes ?? null,
    cod_collected: payload.codCollected ?? 0,
    receiver_name: payload.receiverName ?? null,
    photo_url: payload.photoUrl ?? null,
    signature_data_url: payload.signatureDataUrl ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  await updateJobStatus(payload.jobId, 'delivered', payload.notes);
}

export async function submitFailedAttempt(payload: ExceptionPayload) {
  const { error } = await supabase.from('delivery_exceptions').insert({
    job_id: payload.jobId,
    reason: payload.reason,
    notes: payload.notes ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  await updateJobStatus(payload.jobId, 'failed_attempt', payload.notes);
}

export async function submitCodHandover(userId: string, payload: HandoverPayload) {
  const { error } = await supabase.from('cod_handovers').insert({
    rider_id: userId,
    amount: payload.amount,
    reference: payload.reference,
    notes: payload.notes ?? null,
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  });

  if (error) throw error;
}

export async function createSupportTicket(userId: string, subject: string, details: string) {
  const { error } = await supabase.from('support_tickets').insert({
    raised_by: userId,
    subject,
    details,
    status: 'open',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
EOF

cat > src/lib/rider-driver/useRiderDriverData.ts <<'EOF'
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createSupportTicket,
  getAssignedJobs,
  getCodRecords,
  getEarningsSummary,
  getMyFieldProfile,
  getRouteStops,
  submitCodHandover,
  submitFailedAttempt,
  submitProof,
  updateJobStatus,
} from './api';
import type {
  CodRecord,
  EarningsSummary,
  RiderDriverJob,
  RiderDriverProfile,
  RiderDriverStop,
} from './types';

export function useRiderDriverData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RiderDriverProfile | null>(null);
  const [jobs, setJobs] = useState<RiderDriverJob[]>([]);
  const [stops, setStops] = useState<RiderDriverStop[]>([]);
  const [codRecords, setCodRecords] = useState<CodRecord[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [error, setError] = useState<string>('');

  const userId = user?.id ?? '';

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [profileData, jobsData, stopsData, codData, earningsData] = await Promise.all([
        getMyFieldProfile(userId),
        getAssignedJobs(userId),
        getRouteStops(userId),
        getCodRecords(userId),
        getEarningsSummary(userId),
      ]);
      setProfile(profileData);
      setJobs(jobsData);
      setStops(stopsData);
      setCodRecords(codData);
      setEarnings(earningsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load rider/driver data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [userId]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => ['assigned', 'en_route', 'picked_up', 'out_for_delivery'].includes(job.status)),
    [jobs]
  );

  return {
    loading,
    error,
    profile,
    jobs,
    activeJobs,
    stops,
    codRecords,
    earnings,
    refresh,
    async markEnRoute(jobId: string) {
      await updateJobStatus(jobId, 'en_route');
      await refresh();
    },
    async markPickedUp(jobId: string) {
      await updateJobStatus(jobId, 'picked_up');
      await refresh();
    },
    async submitProofAndRefresh(payload: Parameters<typeof submitProof>[0]) {
      await submitProof(payload);
      await refresh();
    },
    async submitFailedAttemptAndRefresh(payload: Parameters<typeof submitFailedAttempt>[0]) {
      await submitFailedAttempt(payload);
      await refresh();
    },
    async submitCodHandoverAndRefresh(amount: number, reference: string, notes?: string) {
      if (!userId) return;
      await submitCodHandover(userId, { amount, reference, notes });
      await refresh();
    },
    async createSupportTicketAndRefresh(subject: string, details: string) {
      if (!userId) return;
      await createSupportTicket(userId, subject, details);
      await refresh();
    },
  };
}
EOF

cat > src/components/rider-driver/RiderDriverShell.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/JobsBoard.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/RouteBoard.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/PodCapture.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/CodPanel.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/EarningsPanel.tsx <<'EOF'
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
EOF

cat > src/components/rider-driver/SupportPanel.tsx <<'EOF'
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
EOF

cat > src/pages/RiderApp.tsx <<'EOF'
import { useMemo, useState } from 'react';
import RiderDriverShell from '@/components/rider-driver/RiderDriverShell';
import JobsBoard from '@/components/rider-driver/JobsBoard';
import RouteBoard from '@/components/rider-driver/RouteBoard';
import PodCapture from '@/components/rider-driver/PodCapture';
import CodPanel from '@/components/rider-driver/CodPanel';
import EarningsPanel from '@/components/rider-driver/EarningsPanel';
import SupportPanel from '@/components/rider-driver/SupportPanel';
import { useRiderDriverData } from '@/lib/rider-driver/useRiderDriverData';
import type { FieldTab, default as Shell } from '@/components/rider-driver/RiderDriverShell';

export default function RiderApp() {
  const {
    loading,
    error,
    profile,
    jobs,
    stops,
    codRecords,
    earnings,
    refresh,
    markEnRoute,
    markPickedUp,
    submitProofAndRefresh,
    submitFailedAttemptAndRefresh,
    submitCodHandoverAndRefresh,
    createSupportTicketAndRefresh,
  } = useRiderDriverData();

  const [activeTab, setActiveTab] = useState<FieldTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId]
  );

  if (loading) {
    return <div className="p-6 text-white">Loading rider workspace...</div>;
  }

  return (
    <RiderDriverShell
      role="rider"
      profile={profile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={refresh}
    >
      {error ? <div className="mb-5 rounded-2xl bg-red-500/10 p-4 text-red-200">{error}</div> : null}

      {activeTab === 'jobs' && (
        <JobsBoard
          jobs={jobs}
          selectedJob={selectedJob}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          onMarkEnRoute={markEnRoute}
          onMarkPickedUp={markPickedUp}
        />
      )}

      {activeTab === 'route' && <RouteBoard stops={stops} />}

      {activeTab === 'pod' && (
        <PodCapture
          selectedJob={selectedJob}
          onSubmitProof={submitProofAndRefresh}
          onSubmitFailedAttempt={submitFailedAttemptAndRefresh}
        />
      )}

      {activeTab === 'cod' && (
        <CodPanel
          codRecords={codRecords}
          onSubmitHandover={submitCodHandoverAndRefresh}
        />
      )}

      {activeTab === 'earnings' && <EarningsPanel earnings={earnings} />}

      {activeTab === 'support' && (
        <SupportPanel onSubmit={createSupportTicketAndRefresh} />
      )}
    </RiderDriverShell>
  );
}
EOF

cat > src/pages/DriverApp.tsx <<'EOF'
import { useMemo, useState } from 'react';
import RiderDriverShell from '@/components/rider-driver/RiderDriverShell';
import JobsBoard from '@/components/rider-driver/JobsBoard';
import RouteBoard from '@/components/rider-driver/RouteBoard';
import PodCapture from '@/components/rider-driver/PodCapture';
import CodPanel from '@/components/rider-driver/CodPanel';
import EarningsPanel from '@/components/rider-driver/EarningsPanel';
import SupportPanel from '@/components/rider-driver/SupportPanel';
import { useRiderDriverData } from '@/lib/rider-driver/useRiderDriverData';
import type { FieldTab } from '@/components/rider-driver/RiderDriverShell';

export default function DriverApp() {
  const {
    loading,
    error,
    profile,
    jobs,
    stops,
    codRecords,
    earnings,
    refresh,
    markEnRoute,
    markPickedUp,
    submitProofAndRefresh,
    submitFailedAttemptAndRefresh,
    submitCodHandoverAndRefresh,
    createSupportTicketAndRefresh,
  } = useRiderDriverData();

  const [activeTab, setActiveTab] = useState<FieldTab>('route');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId]
  );

  if (loading) {
    return <div className="p-6 text-white">Loading driver workspace...</div>;
  }

  return (
    <RiderDriverShell
      role="driver"
      profile={profile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={refresh}
    >
      {error ? <div className="mb-5 rounded-2xl bg-red-500/10 p-4 text-red-200">{error}</div> : null}

      {activeTab === 'jobs' && (
        <JobsBoard
          jobs={jobs}
          selectedJob={selectedJob}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          onMarkEnRoute={markEnRoute}
          onMarkPickedUp={markPickedUp}
        />
      )}

      {activeTab === 'route' && <RouteBoard stops={stops} />}

      {activeTab === 'pod' && (
        <PodCapture
          selectedJob={selectedJob}
          onSubmitProof={submitProofAndRefresh}
          onSubmitFailedAttempt={submitFailedAttemptAndRefresh}
        />
      )}

      {activeTab === 'cod' && (
        <CodPanel
          codRecords={codRecords}
          onSubmitHandover={submitCodHandoverAndRefresh}
        />
      )}

      {activeTab === 'earnings' && <EarningsPanel earnings={earnings} />}

      {activeTab === 'support' && (
        <SupportPanel onSubmit={createSupportTicketAndRefresh} />
      )}
    </RiderDriverShell>
  );
}
EOF

echo "Done. Files created:
- src/lib/rider-driver/types.ts
- src/lib/rider-driver/api.ts
- src/lib/rider-driver/useRiderDriverData.ts
- src/components/rider-driver/RiderDriverShell.tsx
- src/components/rider-driver/JobsBoard.tsx
- src/components/rider-driver/RouteBoard.tsx
- src/components/rider-driver/PodCapture.tsx
- src/components/rider-driver/CodPanel.tsx
- src/components/rider-driver/EarningsPanel.tsx
- src/components/rider-driver/SupportPanel.tsx
- src/pages/RiderApp.tsx
- src/pages/DriverApp.tsx
"
