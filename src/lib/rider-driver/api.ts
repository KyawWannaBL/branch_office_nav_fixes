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

function mapCollectionStatus(value?: string | null): CodRecord['status'] {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  if (normalized === 'handed-over' || normalized === 'handed_over') return 'handed_over';
  if (normalized === 'pending-handover' || normalized === 'pending_handover') return 'pending_handover';
  return 'collected';
}

function mapJobStatus(value?: string | null): RiderDriverJob['status'] {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  switch (normalized) {
    case 'assigned':
      return 'assigned';
    case 'en-route':
      return 'en_route';
    case 'picked-up':
      return 'picked_up';
    case 'out-for-delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    case 'failed-attempt':
      return 'failed_attempt';
    case 'returned':
      return 'returned';
    default:
      return 'exception';
  }
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
    trackingNo: row.tracking_no ?? row.id,
    customerName: row.customer_name ?? 'Customer',
    customerPhone: row.customer_phone ?? null,
    merchantName: row.merchant_name ?? null,
    township: row.township ?? null,
    address: row.address ?? null,
    codAmount: Number(row.cod_amount ?? 0),
    status: mapJobStatus(row.status),
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
    .select('id, tracking_no, shipment_id, amount, status, collected_at, driver_id')
    .eq('driver_id', userId)
    .order('collected_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    trackingNo: row.tracking_no ?? row.shipment_id ?? row.id,
    amount: Number(row.amount ?? 0),
    status: mapCollectionStatus(row.status),
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
    .filter((item) => item.status === 'pending_handover' || item.status === 'collected')
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
    driver_id: userId,
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
