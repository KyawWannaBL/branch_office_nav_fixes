// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  UserPlus,
  FileText,
  BellRing,
  CheckCircle2,
  XCircle,
  Briefcase,
  Building2,
  Clock3,
  BadgeCheck,
  Siren,
  Fingerprint,
  BookOpen,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { addressText, safeText } from '@/lib/displayValue';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { PhotoUploaderField } from '@/components/workflow/PhotoUploaderField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}

function currentView(pathname: string) {
  if (pathname.includes('/employees')) return 'employees';
  if (pathname.includes('/approvals')) return 'approvals';
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/reports')) return 'reports';
  return 'overview';
}

function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtCurrency(value: unknown) {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0)} MMK`;
}

function pick(source: any, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function statusClass(value: unknown) {
  const status = String(value || '').toLowerCase();
  if (status.includes('approve') || status.includes('active') || status.includes('complete') || status.includes('resolved')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status.includes('reject') || status.includes('fail') || status.includes('inactive') || status.includes('disciplinary')) {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  if (status.includes('pending') || status.includes('review') || status.includes('hold')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function scopeRows(rows: any[], scopeBranchId: string, isGlobal: boolean) {
  if (isGlobal || !scopeBranchId) return rows;
  return rows.filter((row) => {
    const keys = ['branch_id', 'from_branch_id', 'to_branch_id', 'destination_branch_id', 'home_branch_id'];
    const values = keys.map((key) => row?.[key]).filter(Boolean);
    if (!values.length) return true;
    return values.includes(scopeBranchId);
  });
}

function isLeaveActive(row: any) {
  const status = String(row?.status || '').toLowerCase();
  if (status !== 'approved') return false;
  const today = new Date();
  const start = row?.start_date ? new Date(row.start_date) : null;
  const end = row?.end_date ? new Date(row.end_date) : null;
  if (!start || !end) return false;
  return today >= start && today <= end;
}

function summarizeAttendance(rows: any[], employeeId: string) {
  return rows.filter((row) => String(row?.employee_id || '') === String(employeeId || '')).length;
}

export default function AdminHrPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [roleBindings, setRoleBindings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [disciplinaryCases, setDisciplinaryCases] = useState<any[]>([]);
  const [assetAssignments, setAssetAssignments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [documentPath, setDocumentPath] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_type: 'Operations Staff',
    department: 'Operations',
    title: 'Executive',
    branch_id: '',
    employment_status: 'active',
  });
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [documentForm, setDocumentForm] = useState({
    employee_id: '',
    document_type: 'contract',
    title: '',
    status: 'uploaded',
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    route: '/admin-hr',
    priority: 'normal',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function fetchRows(table: string, orderColumn = 'created_at', ascending = false) {
    try {
      let query = supabase.from(table).select('*');
      if (orderColumn) query = query.order(orderColumn, { ascending });
      const { data, error } = await query;
      if (error) {
        console.warn(`[AdminHrPortal] ${table}`, error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn(`[AdminHrPortal] ${table}`, err);
      return [];
    }
  }

  async function createAuditLog(action: string, meta: any = {}) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: profile?.id || profile?.user_id || null,
        portal: 'admin_hr',
        action,
        ref_type: meta?.ref_type || null,
        ref_id: meta?.ref_id || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[AdminHrPortal] audit log skipped', err);
    }
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();

      const [
        branchRows,
        userRows,
        roleRows,
        roleBindingRows,
        employeeRows,
        attendanceRows,
        leaveRows,
        documentRows,
        trainingRows,
        disciplinaryRows,
        assetRows,
        notificationRows,
        auditRows,
      ] = await Promise.all([
        fetchRows('branches', 'code', true),
        fetchRows('users', 'created_at', false),
        fetchRows('roles', 'name', true),
        fetchRows('role_bindings', 'created_at', false),
        fetchRows('employees', 'created_at', false),
        fetchRows('attendance', 'attendance_date', false),
        fetchRows('leave_requests', 'created_at', false),
        fetchRows('hr_documents', 'created_at', false),
        fetchRows('training_records', 'created_at', false),
        fetchRows('disciplinary_cases', 'created_at', false),
        fetchRows('asset_assignments', 'created_at', false),
        fetchRows('notifications', 'created_at', false),
        fetchRows('audit_logs', 'created_at', false),
      ]);

      const currentEmployee = employeeRows.find((row: any) =>
        String(pick(row, ['user_id', 'auth_user_id'])) === String(auth.user?.id || '') ||
        String(pick(row, ['email'])) === String(auth.user?.email || '')
      ) || null;

      const currentUser = userRows.find((row: any) =>
        String(pick(row, ['id', 'auth_user_id'])) === String(auth.user?.id || '') ||
        String(pick(row, ['email'])) === String(auth.user?.email || '')
      ) || null;

      const currentBindingRows = roleBindingRows.filter((row: any) =>
        String(row?.user_id || '') === String(currentUser?.id || auth.user?.id || '') ||
        String(row?.employee_id || '') === String(currentEmployee?.id || '')
      );

      const boundRoleIds = new Set(currentBindingRows.map((row: any) => row.role_id));
      const currentRoleNames = roleRows
        .filter((row: any) => boundRoleIds.has(row.id))
        .map((row: any) => String(row?.name || ''));

      const mergedProfile = {
        ...currentUser,
        ...currentEmployee,
        currentRoleNames,
        email: pick(currentUser, ['email'], pick(currentEmployee, ['email'], auth.user?.email || '')),
      };

      const isGlobalAdmin = currentRoleNames.some((name: string) => /super|admin|owner|hr manager|hr admin/i.test(name)) ||
        /admin|manager|head/i.test(String(pick(mergedProfile, ['employee_type', 'title', 'department', 'role'], '')));
      const scopeBranchId = isGlobalAdmin ? '' : String(pick(mergedProfile, ['branch_id'], ''));

      setProfile(mergedProfile);
      setBranches(branchRows);
      setUsers(scopeRows(userRows, scopeBranchId, isGlobalAdmin));
      setRoles(roleRows);
      setRoleBindings(roleBindingRows);
      setEmployees(scopeRows(employeeRows, scopeBranchId, isGlobalAdmin));
      setAttendance(scopeRows(attendanceRows, scopeBranchId, isGlobalAdmin));
      setLeaveRequests(scopeRows(leaveRows, scopeBranchId, isGlobalAdmin));
      setDocuments(scopeRows(documentRows, scopeBranchId, isGlobalAdmin));
      setTrainingRecords(scopeRows(trainingRows, scopeBranchId, isGlobalAdmin));
      setDisciplinaryCases(scopeRows(disciplinaryRows, scopeBranchId, isGlobalAdmin));
      setAssetAssignments(scopeRows(assetRows, scopeBranchId, isGlobalAdmin));
      setNotifications(scopeRows(notificationRows, scopeBranchId, isGlobalAdmin));
      setAuditLogs(scopeRows(auditRows, scopeBranchId, isGlobalAdmin));

      setEmployeeForm((prev) => ({ ...prev, branch_id: prev.branch_id || scopeBranchId || pick(branchRows?.[0], ['id'], '') }));
      setLeaveForm((prev) => ({ ...prev, employee_id: prev.employee_id || pick(currentEmployee, ['id'], pick(employeeRows?.[0], ['id'], '')) }));
      setDocumentForm((prev) => ({ ...prev, employee_id: prev.employee_id || pick(currentEmployee, ['id'], pick(employeeRows?.[0], ['id'], '')) }));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unable to load Admin & HR portal data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function createEmployee() {
    setSaving(true);
    try {
      const payload = {
        full_name: employeeForm.full_name,
        email: employeeForm.email,
        phone: employeeForm.phone,
        employee_type: employeeForm.employee_type,
        department: employeeForm.department,
        title: employeeForm.title,
        branch_id: employeeForm.branch_id || null,
        employment_status: employeeForm.employment_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('employees').insert(payload).select('*').maybeSingle();
      if (error) throw error;

      await createAuditLog('employee_created', { ref_type: 'employee', ref_id: data?.id });
      setEmployeeForm({
        full_name: '',
        email: '',
        phone: '',
        employee_type: 'Operations Staff',
        department: 'Operations',
        title: 'Executive',
        branch_id: employeeForm.branch_id,
        employment_status: 'active',
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function createLeaveRequest() {
    if (!leaveForm.employee_id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('leave_requests').insert({
        employee_id: leaveForm.employee_id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      }).select('*').maybeSingle();
      if (error) throw error;

      await createAuditLog('leave_requested', { ref_type: 'leave_request', ref_id: data?.id });
      setLeaveForm({ ...leaveForm, start_date: '', end_date: '', reason: '' });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function updateLeaveStatus(row: any, status: string) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw error;

      await createAuditLog(`leave_${status}`, { ref_type: 'leave_request', ref_id: row.id });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function createHrDocument() {
    if (!documentForm.employee_id || !documentPath) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('hr_documents').insert({
        employee_id: documentForm.employee_id,
        document_type: documentForm.document_type,
        title: documentForm.title || documentForm.document_type,
        status: documentForm.status,
        bucket: 'hr',
        object_key: documentPath,
        created_at: new Date().toISOString(),
      }).select('*').maybeSingle();
      if (error) throw error;

      await createAuditLog('hr_document_uploaded', { ref_type: 'hr_document', ref_id: data?.id });
      setDocumentPath('');
      setDocumentForm({ ...documentForm, title: '' });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function createNotification() {
    if (!notificationForm.title || !notificationForm.body) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('notifications').insert({
        user_id: null,
        title: notificationForm.title,
        body: notificationForm.body,
        route: notificationForm.route,
        priority: notificationForm.priority,
        created_at: new Date().toISOString(),
      }).select('*').maybeSingle();
      if (error) throw error;

      await createAuditLog('broadcast_notification_created', { ref_type: 'notification', ref_id: data?.id });
      setNotificationForm({ title: '', body: '', route: '/admin-hr', priority: 'normal' });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const roleMap = useMemo(() => {
    const map = new Map();
    roles.forEach((row: any) => map.set(row.id, row));
    return map;
  }, [roles]);

  const branchMap = useMemo(() => {
    const map = new Map();
    branches.forEach((row: any) => map.set(row.id, row));
    return map;
  }, [branches]);

  const employeeStats = useMemo(() => {
    const active = employees.filter((row: any) => String(pick(row, ['employment_status'], 'active')).toLowerCase() === 'active').length;
    const onLeave = leaveRequests.filter(isLeaveActive).length;
    const pendingApprovals = leaveRequests.filter((row: any) => String(row?.status || '').toLowerCase() === 'pending').length;
    const assetsInUse = assetAssignments.filter((row: any) => String(row?.status || '').toLowerCase() !== 'returned').length;
    const openCases = disciplinaryCases.filter((row: any) => !['resolved', 'closed'].includes(String(row?.status || '').toLowerCase())).length;
    const completedTraining = trainingRecords.filter((row: any) => String(row?.status || '').toLowerCase() === 'completed').length;
    return { active, onLeave, pendingApprovals, assetsInUse, openCases, completedTraining };
  }, [employees, leaveRequests, assetAssignments, disciplinaryCases, trainingRecords]);

  const branchSummary = useMemo(() => {
    return branches.map((branch: any) => {
      const team = employees.filter((row: any) => String(row?.branch_id || '') === String(branch.id || ''));
      const pending = leaveRequests.filter((row: any) => String(row?.branch_id || '') === String(branch.id || '') && String(row?.status || '').toLowerCase() === 'pending');
      return {
        id: branch.id,
        code: pick(branch, ['code'], '—'),
        name: pick(branch, ['name', 'city'], 'Branch'),
        headcount: team.length,
        pending: pending.length,
      };
    });
  }, [branches, employees, leaveRequests]);

  const employeeCards = useMemo(() => {
    return employees.map((row: any) => {
      const employeeId = String(row?.id || '');
      const bindingRows = roleBindings.filter((binding: any) => String(binding?.employee_id || '') === employeeId || String(binding?.user_id || '') === String(row?.user_id || ''));
      const roleNames = bindingRows
        .map((binding: any) => roleMap.get(binding.role_id))
        .filter(Boolean)
        .map((role: any) => role.name);
      return {
        ...row,
        roleNames,
        attendanceCount: summarizeAttendance(attendance, employeeId),
        documentCount: documents.filter((doc: any) => String(doc?.employee_id || '') === employeeId).length,
        trainingCount: trainingRecords.filter((doc: any) => String(doc?.employee_id || '') === employeeId).length,
        assetCount: assetAssignments.filter((doc: any) => String(doc?.employee_id || '') === employeeId && String(doc?.status || '').toLowerCase() !== 'returned').length,
      };
    });
  }, [employees, roleBindings, roleMap, attendance, documents, trainingRecords, assetAssignments]);

  const report = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employeeStats.active;
    const pendingApprovals = employeeStats.pendingApprovals;
    const documentCoverage = totalEmployees ? Math.round((documents.length / totalEmployees) * 100) : 0;
    const trainingCoverage = totalEmployees ? Math.round((employeeStats.completedTraining / totalEmployees) * 100) : 0;
    const unreadNotifications = notifications.filter((row: any) => !row?.read_at).length;
    return { totalEmployees, activeEmployees, pendingApprovals, documentCoverage, trainingCoverage, unreadNotifications };
  }, [employees, employeeStats, documents, notifications]);

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'employees' ? 'hr_employees' : view === 'approvals' ? 'hr_approvals' : view === 'admin' ? 'admin_governance' : view === 'reports' ? 'hr_reports' : 'admin_hr')}
        title={tt(language, 'Admin & HR Portal', 'Admin & HR Portal')}
        subtitle={tt(language, 'Workforce operations, approvals, governance, and branch support.', 'ဝန်ထမ်းစီမံခန့်ခွဲမှု၊ approvals၊ governance နှင့် branch support')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading || saving}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-5">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'overview' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/admin-hr')}>{tt(language, 'Overview', 'Overview')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'employees' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/admin-hr/employees')}>{tt(language, 'Employees', 'Employees')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'approvals' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/admin-hr/approvals')}>{tt(language, 'Approvals', 'Approvals')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'admin' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/admin-hr/admin')}>{tt(language, 'Admin Controls', 'Admin Controls')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'reports' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/admin-hr/reports')}>{tt(language, 'Reports', 'Reports')}</button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{safeText(error)}</CardContent>
        </Card>
      ) : null}

      {view === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'Active Employees', 'Active Employees')}</div><Users className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.active}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'On Leave', 'On Leave')}</div><Clock3 className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.onLeave}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'Pending Approvals', 'Pending Approvals')}</div><ClipboardList className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.pendingApprovals}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'Assets In Use', 'Assets In Use')}</div><Briefcase className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.assetsInUse}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'Open Cases', 'Open Cases')}</div><AlertTriangle className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.openCases}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{tt(language, 'Training Complete', 'Training Complete')}</div><BookOpen className="h-4 w-4 text-muted-foreground" /></div><div className="mt-2 text-4xl font-semibold">{employeeStats.completedTraining}</div></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Workforce Snapshot', 'Workforce Snapshot')}</CardTitle>
                <CardDescription>{safeText(pick(profile, ['full_name', 'name', 'email'], 'Britium Express'))}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {employeeCards.slice(0, 8).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{safeText(pick(row, ['full_name', 'name'], 'Unnamed Employee'))}</div>
                        <div className="text-sm text-muted-foreground">{safeText(pick(row, ['title', 'employee_type', 'department'], 'Team Member'))} · {safeText(pick(branchMap.get(row?.branch_id), ['name', 'code'], 'All Branches'))}</div>
                        <div className="text-sm text-muted-foreground">{safeText(pick(row, ['email'], '—'))} · {safeText(pick(row, ['phone'], '—'))}</div>
                      </div>
                      <Badge className={statusClass(pick(row, ['employment_status'], 'active'))}>{labelize(pick(row, ['employment_status'], 'active'))}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-1">{row.attendanceCount} attendance</span>
                      <span className="rounded-full bg-muted px-2 py-1">{row.documentCount} docs</span>
                      <span className="rounded-full bg-muted px-2 py-1">{row.trainingCount} training</span>
                      <span className="rounded-full bg-muted px-2 py-1">{row.assetCount} assets</span>
                      {row.roleNames.slice(0, 2).map((roleName: string) => <span key={roleName} className="rounded-full bg-muted px-2 py-1">{safeText(roleName)}</span>)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tt(language, 'Branch Coverage', 'Branch Coverage')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branchSummary.slice(0, 6).map((row: any) => (
                    <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{safeText(row.name)}</div>
                        <div className="text-sm text-muted-foreground">{safeText(row.code)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{row.headcount}</div>
                        <div className="text-sm text-muted-foreground">{row.pending} pending</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{tt(language, 'Recent Alerts', 'Recent Alerts')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.slice(0, 5).map((row: any) => (
                    <div key={row.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{safeText(row.title)}</div>
                        <Badge className={statusClass(pick(row, ['priority'], 'normal'))}>{labelize(pick(row, ['priority'], 'normal'))}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{safeText(row.body)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {view === 'employees' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Employee Directory', 'Employee Directory')}</CardTitle>
                <CardDescription>{tt(language, 'Create and manage branch-level workforce records.', 'branch workforce records များကို စီမံရန်')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder={tt(language, 'Full Name', 'အမည်အပြည့်အစုံ')} value={employeeForm.full_name} onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} />
                  <Input placeholder="Email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
                  <Input placeholder={tt(language, 'Phone', 'ဖုန်း')} value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
                  <Input placeholder={tt(language, 'Department', 'ဌာန')} value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} />
                  <Input placeholder={tt(language, 'Job Title', 'ရာထူး')} value={employeeForm.title} onChange={(e) => setEmployeeForm({ ...employeeForm, title: e.target.value })} />
                  <Input placeholder={tt(language, 'Employee Type', 'ဝန်ထမ်းအမျိုးအစား')} value={employeeForm.employee_type} onChange={(e) => setEmployeeForm({ ...employeeForm, employee_type: e.target.value })} />
                  <Input placeholder={tt(language, 'Branch ID', 'Branch ID')} value={employeeForm.branch_id} onChange={(e) => setEmployeeForm({ ...employeeForm, branch_id: e.target.value })} />
                  <Input placeholder={tt(language, 'Status', 'အခြေအနေ')} value={employeeForm.employment_status} onChange={(e) => setEmployeeForm({ ...employeeForm, employment_status: e.target.value })} />
                </div>
                <Button onClick={createEmployee} disabled={saving}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {tt(language, 'Save Employee', 'ဝန်ထမ်းသိမ်းမည်')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'HR Document Upload', 'HR Document Upload')}</CardTitle>
                <CardDescription>{tt(language, 'Attach contracts, IDs, policy acknowledgements, and onboarding records.', 'contract, ID, policy acknowledgement နှင့် onboarding records')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={tt(language, 'Employee ID', 'Employee ID')} value={documentForm.employee_id} onChange={(e) => setDocumentForm({ ...documentForm, employee_id: e.target.value })} />
                <Input placeholder={tt(language, 'Document Type', 'Document Type')} value={documentForm.document_type} onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })} />
                <Input placeholder={tt(language, 'Document Title', 'Document Title')} value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} />
                <PhotoUploaderField label={tt(language, 'HR File', 'HR File')} onUploaded={(path) => setDocumentPath(path)} />
                <Button onClick={createHrDocument} disabled={saving || !documentPath}>
                  <Save className="mr-2 h-4 w-4" />
                  {tt(language, 'Save Document', 'Document သိမ်းမည်')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Employee Cards', 'Employee Cards')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employeeCards.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(pick(row, ['full_name', 'name'], 'Unnamed Employee'))}</div>
                      <div className="text-sm text-muted-foreground">{safeText(pick(row, ['department', 'employee_type'], 'Operations'))} · {safeText(pick(row, ['title'], 'Staff'))}</div>
                      <div className="text-sm text-muted-foreground">{safeText(pick(row, ['email'], '—'))} · {safeText(pick(row, ['phone'], '—'))}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusClass(pick(row, ['employment_status'], 'active'))}>{labelize(pick(row, ['employment_status'], 'active'))}</Badge>
                      <Badge>{safeText(pick(branchMap.get(row?.branch_id), ['code', 'name'], 'Branch'))}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {row.roleNames.length ? row.roleNames.map((roleName: string) => <span key={roleName} className="rounded-full bg-muted px-2 py-1">{safeText(roleName)}</span>) : <span className="rounded-full bg-muted px-2 py-1">No role binding</span>}
                    <span className="rounded-full bg-muted px-2 py-1">{row.attendanceCount} attendance</span>
                    <span className="rounded-full bg-muted px-2 py-1">{row.documentCount} docs</span>
                    <span className="rounded-full bg-muted px-2 py-1">{row.trainingCount} training</span>
                    <span className="rounded-full bg-muted px-2 py-1">{row.assetCount} assets</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'approvals' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Leave Request Queue', 'Leave Request Queue')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaveRequests.map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{safeText(pick(employees.find((employee: any) => String(employee.id) === String(row.employee_id)), ['full_name', 'name'], row.employee_id))}</div>
                        <div className="text-sm text-muted-foreground">{labelize(row.leave_type)} · {safeText(row.start_date)} → {safeText(row.end_date)}</div>
                        <div className="text-sm text-muted-foreground">{safeText(row.reason)}</div>
                      </div>
                      <Badge className={statusClass(row.status)}>{labelize(row.status)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateLeaveStatus(row, 'approved')} disabled={saving || String(row?.status || '').toLowerCase() === 'approved'}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {tt(language, 'Approve', 'Approve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateLeaveStatus(row, 'rejected')} disabled={saving || String(row?.status || '').toLowerCase() === 'rejected'}>
                        <XCircle className="mr-2 h-4 w-4" />
                        {tt(language, 'Reject', 'Reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Submit Leave Request', 'Leave Request Submit')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={tt(language, 'Employee ID', 'Employee ID')} value={leaveForm.employee_id} onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })} />
                <Input placeholder={tt(language, 'Leave Type', 'Leave Type')} value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} />
                <Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
                <Input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
                <textarea className="min-h-[120px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Reason', 'အကြောင်းပြချက်')} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                <Button onClick={createLeaveRequest} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {tt(language, 'Create Request', 'Request တင်မည်')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Document Compliance', 'Document Compliance')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {documents.slice(0, 8).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(pick(row, ['title', 'document_type'], 'HR Document'))}</div>
                      <div className="text-sm text-muted-foreground">{safeText(pick(employees.find((employee: any) => String(employee.id) === String(row.employee_id)), ['full_name', 'name'], row.employee_id))}</div>
                    </div>
                    <Badge className={statusClass(pick(row, ['status'], 'uploaded'))}>{labelize(pick(row, ['status'], 'uploaded'))}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{tt(language, 'Disciplinary / Risk Review', 'Disciplinary / Risk Review')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {disciplinaryCases.slice(0, 8).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{safeText(pick(employees.find((employee: any) => String(employee.id) === String(row.employee_id)), ['full_name', 'name'], row.employee_id))}</div>
                        <div className="text-sm text-muted-foreground">{safeText(pick(row, ['case_type'], 'Case'))}</div>
                      </div>
                      <Badge className={statusClass(pick(row, ['status'], 'open'))}>{labelize(pick(row, ['status'], 'open'))}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'admin' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Access Governance', 'Access Governance')}</CardTitle>
                <CardDescription>{tt(language, 'Role bindings, branch scoping, and audit visibility.', 'role bindings၊ branch scoping နှင့် audit visibility')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.slice(0, 8).map((row: any) => {
                  const userBindings = roleBindings.filter((binding: any) => String(binding?.user_id || '') === String(row?.id || ''));
                  const userRoleNames = userBindings.map((binding: any) => roleMap.get(binding.role_id)).filter(Boolean).map((role: any) => role.name);
                  return (
                    <div key={row.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{safeText(pick(row, ['full_name', 'name', 'email'], 'User'))}</div>
                          <div className="text-sm text-muted-foreground">{safeText(pick(row, ['email'], '—'))}</div>
                        </div>
                        <Badge className={statusClass(pick(row, ['active'], true) ? 'active' : 'inactive')}>{pick(row, ['active'], true) ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {userRoleNames.length ? userRoleNames.map((roleName: string) => <span key={roleName} className="rounded-full bg-muted px-2 py-1">{safeText(roleName)}</span>) : <span className="rounded-full bg-muted px-2 py-1">No role binding</span>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tt(language, 'Broadcast Notice', 'Broadcast Notice')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={tt(language, 'Title', 'ခေါင်းစဉ်')} value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} />
                <Input placeholder={tt(language, 'Route', 'Route')} value={notificationForm.route} onChange={(e) => setNotificationForm({ ...notificationForm, route: e.target.value })} />
                <Input placeholder={tt(language, 'Priority', 'Priority')} value={notificationForm.priority} onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value })} />
                <textarea className="min-h-[120px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Message', 'မက်ဆေ့ချ်')} value={notificationForm.body} onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })} />
                <Button onClick={createNotification} disabled={saving}>
                  <BellRing className="mr-2 h-4 w-4" />
                  {tt(language, 'Send Notice', 'Notice ပို့မည်')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Branch Directory', 'Branch Directory')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {branches.map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(pick(row, ['name', 'code'], 'Branch'))}</div>
                      <div className="text-sm text-muted-foreground">{addressText(pick(row, ['address'], `${pick(row, ['city'], '')}`))}</div>
                    </div>
                    <Badge>{safeText(pick(row, ['code'], '—'))}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{tt(language, 'Audit Stream', 'Audit Stream')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {auditLogs.slice(0, 8).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{safeText(pick(row, ['action'], 'activity'))}</div>
                      <Badge>{safeText(pick(row, ['portal'], 'system'))}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{safeText(pick(row, ['created_at'], ''))}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'reports' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Total Employees', 'စုစုပေါင်းဝန်ထမ်း')}</div><div className="mt-2 text-4xl font-semibold">{report.totalEmployees}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Active', 'လုပ်ဆောင်နေ')}</div><div className="mt-2 text-4xl font-semibold">{report.activeEmployees}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Pending', 'စောင့်ဆိုင်း')}</div><div className="mt-2 text-4xl font-semibold">{report.pendingApprovals}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Doc Coverage', 'Doc Coverage')}</div><div className="mt-2 text-4xl font-semibold">{report.documentCoverage}%</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Training Coverage', 'Training Coverage')}</div><div className="mt-2 text-4xl font-semibold">{report.trainingCoverage}%</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Unread Notices', 'Unread Notices')}</div><div className="mt-2 text-4xl font-semibold">{report.unreadNotifications}</div></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Training & Compliance', 'Training & Compliance')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {trainingRecords.slice(0, 10).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(pick(row, ['training_name', 'title'], 'Training'))}</div>
                      <div className="text-sm text-muted-foreground">{safeText(pick(employees.find((employee: any) => String(employee.id) === String(row.employee_id)), ['full_name', 'name'], row.employee_id))}</div>
                    </div>
                    <Badge className={statusClass(pick(row, ['status'], 'pending'))}>{labelize(pick(row, ['status'], 'pending'))}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{tt(language, 'Asset & Exposure', 'Asset & Exposure')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {assetAssignments.slice(0, 10).map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(pick(row, ['asset_code', 'asset_type'], 'Asset'))}</div>
                      <div className="text-sm text-muted-foreground">{safeText(pick(employees.find((employee: any) => String(employee.id) === String(row.employee_id)), ['full_name', 'name'], row.employee_id))}</div>
                    </div>
                    <Badge className={statusClass(pick(row, ['status'], 'assigned'))}>{labelize(pick(row, ['status'], 'assigned'))}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Payroll / Cost Placeholder', 'Payroll / Cost Placeholder')}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>{tt(language, 'Use this card for payroll summary, allowance totals, and branch labor cost rollups.', 'payroll summary, allowance totals, branch labor cost rollups အတွက်')}</div>
                <div className="font-semibold text-foreground">{fmtCurrency(employeeStats.active * 350000)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Security & Access', 'Security & Access')}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between"><span>{tt(language, 'Role bindings', 'Role bindings')}</span><span className="font-semibold text-foreground">{roleBindings.length}</span></div>
                <div className="flex items-center justify-between"><span>{tt(language, 'Audit events', 'Audit events')}</span><span className="font-semibold text-foreground">{auditLogs.length}</span></div>
                <div className="flex items-center justify-between"><span>{tt(language, 'Active branches', 'Active branches')}</span><span className="font-semibold text-foreground">{branches.length}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{tt(language, 'Urgent Ops', 'Urgent Ops')}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between"><span>{tt(language, 'Pending leave approvals', 'Pending leave approvals')}</span><span className="font-semibold text-foreground">{employeeStats.pendingApprovals}</span></div>
                <div className="flex items-center justify-between"><span>{tt(language, 'Open disciplinary cases', 'Open disciplinary cases')}</span><span className="font-semibold text-foreground">{employeeStats.openCases}</span></div>
                <div className="flex items-center justify-between"><span>{tt(language, 'Unread notices', 'Unread notices')}</span><span className="font-semibold text-foreground">{report.unreadNotifications}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
