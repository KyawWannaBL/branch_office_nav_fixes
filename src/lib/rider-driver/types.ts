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
