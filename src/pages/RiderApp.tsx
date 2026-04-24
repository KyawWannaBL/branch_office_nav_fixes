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
