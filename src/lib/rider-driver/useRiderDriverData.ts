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
