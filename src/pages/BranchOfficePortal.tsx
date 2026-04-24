// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { addressText, safeText } from '@/lib/displayValue';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}
function currentView(pathname: string) {
  if (pathname.includes('/shipments')) return 'shipments';
  if (pathname.includes('/team')) return 'team';
  if (pathname.includes('/finance')) return 'finance';
  return 'overview';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtCurrency(value: unknown) {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0)} MMK`;
}

export default function BranchOfficePortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [branchRows, setBranchRows] = useState<any[]>([]);
  const [staffRows, setStaffRows] = useState<any[]>([]);
  const [shipmentRows, setShipmentRows] = useState<any[]>([]);
  const [financeRows, setFinanceRows] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [financeForm, setFinanceForm] = useState({
    entry_type: 'expense',
    amount: '0',
    entry_date: new Date().toISOString().slice(0, 10),
    category: 'general',
    notes: '',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [bRes, sRes, shipRes, fRes] = await Promise.all([
        supabase.from('branch_offices').select('*').order('branch_name', { ascending: true }),
        supabase.from('staff_master').select('*').order('full_name', { ascending: true }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('branch_office_finance_entries').select('*').order('entry_date', { ascending: false }),
      ]);
      if (bRes.error) throw bRes.error;
      if (sRes.error) throw sRes.error;
      if (shipRes.error) throw shipRes.error;
      if (fRes.error) throw fRes.error;
      setBranchRows(bRes.data || []);
      setStaffRows(sRes.data || []);
      setShipmentRows(shipRes.data || []);
      setFinanceRows(fRes.data || []);
      if (!selectedBranchId && bRes.data?.length) setSelectedBranchId(bRes.data[0].id);
    } catch (e) {
      console.error(e);
      setBranchRows([]);
      setStaffRows([]);
      setShipmentRows([]);
      setFinanceRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const selectedBranch = branchRows.find((r: any) => r.id === selectedBranchId) || null;

  const teamRows = useMemo(() => {
    if (!selectedBranch) return [];
    return staffRows.filter((row: any) =>
      row.branch_name === selectedBranch.branch_name ||
      row.metadata?.branch_code === selectedBranch.branch_code
    );
  }, [staffRows, selectedBranch]);

  const branchShipments = useMemo(() => {
    if (!selectedBranch) return [];
    return shipmentRows.filter((row: any) =>
      row.branch_office_id === selectedBranch.id ||
      row.current_location?.branch_code === selectedBranch.branch_code ||
      row.current_location?.branch_name === selectedBranch.branch_name
    );
  }, [shipmentRows, selectedBranch]);

  const branchFinance = useMemo(() => {
    if (!selectedBranch) return [];
    return financeRows.filter((row: any) => row.branch_office_id === selectedBranch.id);
  }, [financeRows, selectedBranch]);

  async function saveFinanceEntry() {
    if (!selectedBranchId) return;
    const { error } = await supabase.from('branch_office_finance_entries').insert({
      branch_office_id: selectedBranchId,
      entry_type: financeForm.entry_type,
      amount: Number(financeForm.amount || 0),
      entry_date: financeForm.entry_date,
      category: financeForm.category,
      notes: financeForm.notes || null,
    });
    if (error) throw error;
    setFinanceForm({
      entry_type: 'expense',
      amount: '0',
      entry_date: new Date().toISOString().slice(0, 10),
      category: 'general',
      notes: '',
    });
    await loadData();
  }

  const summary = useMemo(() => {
    const income = branchFinance.filter((r: any) => r.entry_type === 'income').reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const expense = branchFinance.filter((r: any) => r.entry_type === 'expense').reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [branchFinance]);

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'shipments' ? 'branch_office_shipments' : view === 'team' ? 'branch_office_team' : view === 'finance' ? 'branch_office_finance' : 'branch_office')}
        title={tt(language, 'Branch Office Portal', 'Branch Office Portal')}
        subtitle={tt(language, 'Overview, shipments, team, and branch finance.', 'overview, shipment, team နှင့် branch finance')}
      >
        <div className="flex gap-3">
          <select className="h-10 rounded-md border px-3 text-sm" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
            {branchRows.map((row: any) => <option key={row.id} value={row.id}>{row.branch_name}</option>)}
          </select>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
          </Button>
        </div>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-4">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'overview' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/branch-office/overview')}>{tt(language, 'Overview', 'Overview')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'shipments' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/branch-office/shipments')}>{tt(language, 'Shipments', 'Shipments')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'team' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/branch-office/team')}>{tt(language, 'Team', 'Team')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'finance' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/branch-office/finance')}>{tt(language, 'Finance', 'Finance')}</button>
      </div>

      {view === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Branch', 'Branch')}</div><div className="mt-2 text-2xl font-semibold">{safeText(selectedBranch?.branch_name)}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Shipments', 'Shipments')}</div><div className="mt-2 text-4xl font-semibold">{branchShipments.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Team', 'Team')}</div><div className="mt-2 text-4xl font-semibold">{teamRows.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Balance', 'Balance')}</div><div className="mt-2 text-4xl font-semibold">{fmtCurrency(summary.balance)}</div></CardContent></Card>
        </div>
      )}

      {view === 'shipments' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Branch Shipments', 'Branch Shipments')}</CardTitle>
            <CardDescription>{safeText(selectedBranch?.branch_name)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {branchShipments.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{safeText(row.awb)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)} · {safeText(row.recipient?.phone)}</div>
                  <div className="text-sm text-muted-foreground">{addressText(row.recipient?.address)}</div>
                </div>
                <Badge>{labelize(row.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'team' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Branch Team', 'Branch Team')}</CardTitle>
            <CardDescription>{safeText(selectedBranch?.branch_name)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{row.full_name}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.staff_type)} · {safeText(row.role_name)}</div>
                </div>
                <Badge>{row.is_active ? tt(language, 'Active', 'Active') : tt(language, 'Inactive', 'Inactive')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'finance' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Add Finance Entry', 'Finance Entry ထည့်ရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={financeForm.entry_type} onChange={(e) => setFinanceForm({ ...financeForm, entry_type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <Input placeholder={tt(language, 'Amount', 'ပမာဏ')} value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })} />
              <Input type="date" value={financeForm.entry_date} onChange={(e) => setFinanceForm({ ...financeForm, entry_date: e.target.value })} />
              <Input placeholder={tt(language, 'Category', 'အမျိုးအစား')} value={financeForm.category} onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })} />
              <textarea className="min-h-[100px] w-full rounded-md border p-3 text-sm" value={financeForm.notes} onChange={(e) => setFinanceForm({ ...financeForm, notes: e.target.value })} placeholder={tt(language, 'Notes', 'မှတ်ချက်')} />
              <Button onClick={saveFinanceEntry}>
                <Save className="mr-2 h-4 w-4" />
                {tt(language, 'Save Entry', 'Entry သိမ်းမည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Branch Finance Ledger', 'Branch Finance Ledger')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">{tt(language, 'Income', 'Income')}</div><div className="mt-2 text-2xl font-semibold">{fmtCurrency(summary.income)}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">{tt(language, 'Expense', 'Expense')}</div><div className="mt-2 text-2xl font-semibold">{fmtCurrency(summary.expense)}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-muted-foreground">{tt(language, 'Balance', 'Balance')}</div><div className="mt-2 text-2xl font-semibold">{fmtCurrency(summary.balance)}</div></div>
              </div>
              {branchFinance.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{safeText(row.category)}</div>
                    <div className="text-sm text-muted-foreground">{row.entry_date} · {safeText(row.notes)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmtCurrency(row.amount)}</div>
                    <div className="text-sm text-muted-foreground">{labelize(row.entry_type)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
