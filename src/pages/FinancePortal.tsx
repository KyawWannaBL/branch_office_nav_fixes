// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { safeText } from '@/lib/displayValue';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}
function currentView(pathname: string) {
  if (pathname.includes('/cod')) return 'cod';
  if (pathname.includes('/invoices')) return 'invoices';
  return 'transactions';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtCurrency(value: unknown) {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0)} MMK`;
}

export default function FinancePortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [receiptForm, setReceiptForm] = useState({
    merchant_profile_id: '',
    receipt_number: '',
    period_start: '',
    period_end: '',
    amount: '0',
    delivery_count: '0',
    due_date: '',
    notes: '',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [trRes, rcRes, shipRes, merRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('finance_receipts').select('*').order('issued_date', { ascending: false }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('merchant_profiles').select('*').order('merchant_name', { ascending: true }),
      ]);
      if (trRes.error) throw trRes.error;
      if (rcRes.error) throw rcRes.error;
      if (shipRes.error) throw shipRes.error;
      if (merRes.error) throw merRes.error;
      setTransactions(trRes.data || []);
      setReceipts(rcRes.data || []);
      setShipments(shipRes.data || []);
      setMerchants(merRes.data || []);
    } catch (e) {
      console.error(e);
      setTransactions([]);
      setReceipts([]);
      setShipments([]);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const codRows = useMemo(
    () => shipments.filter((row: any) => Number(row.cod_amount || 0) > 0 && String(row.status) === 'delivered'),
    [shipments]
  );

  async function createReceipt() {
    const { error } = await supabase.from('finance_receipts').insert({
      merchant_profile_id: receiptForm.merchant_profile_id || null,
      receipt_number: receiptForm.receipt_number,
      period_start: receiptForm.period_start,
      period_end: receiptForm.period_end,
      amount: Number(receiptForm.amount || 0),
      delivery_count: Number(receiptForm.delivery_count || 0),
      due_date: receiptForm.due_date,
      notes: receiptForm.notes || null,
      status: 'pending',
      issued_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;

    const txErr = await supabase.from('finance_transactions').insert({
      transaction_number: `TX-${Date.now()}`,
      related_type: 'finance_receipt',
      category: 'invoice',
      direction: 'in',
      amount: Number(receiptForm.amount || 0),
      status: 'posted',
      transaction_date: new Date().toISOString(),
      notes: `Receipt ${receiptForm.receipt_number}`,
    });
    if (txErr.error) throw txErr.error;

    setReceiptForm({
      merchant_profile_id: '',
      receipt_number: '',
      period_start: '',
      period_end: '',
      amount: '0',
      delivery_count: '0',
      due_date: '',
      notes: '',
    });
    await loadData();
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from('finance_receipts').update({
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    await loadData();
  }

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'cod' ? 'finance_cod' : view === 'invoices' ? 'finance_invoices' : 'finance')}
        title={tt(language, 'Finance Portal', 'Finance Portal')}
        subtitle={tt(language, 'Transactions, COD collections, and invoices.', 'transaction, COD collection နှင့် invoice များ')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-3">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'transactions' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/finance/transactions')}>{tt(language, 'Transactions', 'Transactions')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'cod' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/finance/cod')}>{tt(language, 'COD Collections', 'COD Collections')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'invoices' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/finance/invoices')}>{tt(language, 'Invoices', 'Invoices')}</button>
      </div>

      {view === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>{tt(language, 'Transaction Ledger', 'Transaction Ledger')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {transactions.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{safeText(row.transaction_number)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.category)} · {safeText(row.notes)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{fmtCurrency(row.amount)}</div>
                  <div className="text-sm text-muted-foreground">{labelize(row.status)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'cod' && (
        <Card>
          <CardHeader><CardTitle>{tt(language, 'Delivered COD Shipments', 'ပို့ပြီးသော COD Shipment များ')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {codRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{safeText(row.awb)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)}</div>
                </div>
                <div className="font-semibold">{fmtCurrency(row.cod_amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'invoices' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Create Invoice / Receipt', 'Invoice / Receipt ဖန်တီးရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={receiptForm.merchant_profile_id} onChange={(e) => setReceiptForm({ ...receiptForm, merchant_profile_id: e.target.value })}>
                <option value="">{tt(language, 'Select Merchant', 'Merchant ရွေးပါ')}</option>
                {merchants.map((row: any) => <option key={row.id} value={row.id}>{row.merchant_name}</option>)}
              </select>
              <Input placeholder={tt(language, 'Receipt Number', 'Receipt Number')} value={receiptForm.receipt_number} onChange={(e) => setReceiptForm({ ...receiptForm, receipt_number: e.target.value })} />
              <Input type="date" value={receiptForm.period_start} onChange={(e) => setReceiptForm({ ...receiptForm, period_start: e.target.value })} />
              <Input type="date" value={receiptForm.period_end} onChange={(e) => setReceiptForm({ ...receiptForm, period_end: e.target.value })} />
              <Input placeholder={tt(language, 'Amount', 'ပမာဏ')} value={receiptForm.amount} onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })} />
              <Input placeholder={tt(language, 'Delivery Count', 'Delivery Count')} value={receiptForm.delivery_count} onChange={(e) => setReceiptForm({ ...receiptForm, delivery_count: e.target.value })} />
              <Input type="date" value={receiptForm.due_date} onChange={(e) => setReceiptForm({ ...receiptForm, due_date: e.target.value })} />
              <textarea className="min-h-[100px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Notes', 'မှတ်ချက်')} value={receiptForm.notes} onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })} />
              <Button onClick={createReceipt}>
                <Save className="mr-2 h-4 w-4" />
                {tt(language, 'Save Invoice', 'Invoice သိမ်းမည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Invoice List', 'Invoice List')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {receipts.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{row.receipt_number}</div>
                      <div className="text-sm text-muted-foreground">{row.period_start} → {row.period_end}</div>
                      <div className="text-sm text-muted-foreground">{fmtCurrency(row.amount)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge>{labelize(row.status)}</Badge>
                      {row.status !== 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => markPaid(row.id)}>
                          {tt(language, 'Mark Paid', 'Paid အဖြစ်မှတ်မည်')}
                        </Button>
                      )}
                    </div>
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
