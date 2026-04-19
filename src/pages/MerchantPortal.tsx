// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { addressText, safeText } from '@/lib/displayValue';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { PhotoUploaderField } from '@/components/workflow/PhotoUploaderField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}
function currentView(pathname: string) {
  if (pathname.includes('/create')) return 'create';
  if (pathname.includes('/reports')) return 'reports';
  return 'deliveries';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtCurrency(value: unknown) {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0)} MMK`;
}

export default function MerchantPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [photoPath, setPhotoPath] = useState('');
  const [form, setForm] = useState({
    awb: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    cod_amount: '0',
    shipping_fee: '0',
    weight: '0',
    special_instructions: '',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();

      const merchantRes = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('auth_user_id', auth.user?.id || '')
        .maybeSingle();

      let currentMerchant = merchantRes.data;

      if (!currentMerchant) {
        const fallback = await supabase.from('merchant_profiles').select('*').limit(1).maybeSingle();
        if (fallback.error) throw fallback.error;
        currentMerchant = fallback.data;
      }

      setMerchant(currentMerchant || null);

      const shipRes = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (shipRes.error) throw shipRes.error;

      const receiptRes = await supabase.from('finance_receipts').select('*').order('issued_date', { ascending: false });
      if (receiptRes.error) throw receiptRes.error;

      const filteredShipments = (shipRes.data || []).filter((row: any) =>
        (currentMerchant?.id && row.merchant_profile_id === currentMerchant.id) ||
        (currentMerchant?.email && row.sender?.email === currentMerchant.email) ||
        (currentMerchant?.phone && row.sender?.phone === currentMerchant.phone)
      );

      const filteredReceipts = (receiptRes.data || []).filter((row: any) => row.merchant_profile_id === currentMerchant?.id);

      setShipments(filteredShipments);
      setReceipts(filteredReceipts);
    } catch (e) {
      console.error(e);
      setMerchant(null);
      setShipments([]);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function createShipment() {
    if (!merchant) return;

    const { error } = await supabase.from('shipments').insert({
      awb: form.awb,
      status: 'pending',
      merchant_profile_id: merchant.id,
      sender: {
        name: merchant.contact_name || merchant.merchant_name,
        phone: merchant.phone,
        email: merchant.email,
        address: merchant.address,
      },
      recipient: {
        name: form.recipient_name,
        phone: form.recipient_phone,
        address: form.recipient_address,
      },
      cod_amount: Number(form.cod_amount || 0),
      shipping_fee: Number(form.shipping_fee || 0),
      package_details: {
        weight: Number(form.weight || 0),
        merchant_photo_path: photoPath || null,
      },
      special_instructions: form.special_instructions || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    setForm({
      awb: '',
      recipient_name: '',
      recipient_phone: '',
      recipient_address: '',
      cod_amount: '0',
      shipping_fee: '0',
      weight: '0',
      special_instructions: '',
    });
    setPhotoPath('');
    await loadData();
  }

  const report = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((r: any) => String(r.status) === 'delivered').length;
    const pending = shipments.filter((r: any) => String(r.status) !== 'delivered').length;
    const revenue = shipments.reduce((sum: number, row: any) => sum + Number(row.shipping_fee || 0), 0);
    const cod = shipments.reduce((sum: number, row: any) => sum + Number(row.cod_amount || 0), 0);
    return { total, delivered, pending, revenue, cod };
  }, [shipments]);

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'create' ? 'merchant_create' : view === 'reports' ? 'merchant_reports' : 'merchant')}
        title={tt(language, 'Merchant Portal', 'Merchant Portal')}
        subtitle={tt(language, 'Deliveries, shipment creation, and reports.', 'delivery, shipment ဖန်တီးခြင်း နှင့် report များ')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-3">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'deliveries' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/merchant/deliveries')}>{tt(language, 'My Deliveries', 'My Deliveries')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'create' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/merchant/create')}>{tt(language, 'Create Shipment', 'Create Shipment')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'reports' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/merchant/reports')}>{tt(language, 'Reports', 'Reports')}</button>
      </div>

      {view === 'deliveries' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Merchant Shipments', 'Merchant Shipments')}</CardTitle>
            <CardDescription>{merchant ? safeText(merchant.merchant_name) : '—'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipments.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{safeText(row.awb)}</div>
                    <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)} · {safeText(row.recipient?.phone)}</div>
                    <div className="text-sm text-muted-foreground">{addressText(row.recipient?.address)}</div>
                  </div>
                  <Badge>{labelize(row.status)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'create' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Create Shipment', 'Shipment ဖန်တီးရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="AWB" value={form.awb} onChange={(e) => setForm({ ...form, awb: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Name', 'လက်ခံသူအမည်')} value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Phone', 'လက်ခံသူဖုန်း')} value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Address', 'လက်ခံသူလိပ်စာ')} value={form.recipient_address} onChange={(e) => setForm({ ...form, recipient_address: e.target.value })} />
              <Input placeholder={tt(language, 'COD Amount', 'COD ပမာဏ')} value={form.cod_amount} onChange={(e) => setForm({ ...form, cod_amount: e.target.value })} />
              <Input placeholder={tt(language, 'Shipping Fee', 'ပို့ခ')} value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} />
              <Input placeholder={tt(language, 'Weight KG', 'အလေးချိန် KG')} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              <textarea className="min-h-[100px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Special Instructions', 'အထူးညွှန်ကြားချက်')} value={form.special_instructions} onChange={(e) => setForm({ ...form, special_instructions: e.target.value })} />
              <PhotoUploaderField label={tt(language, 'Package Photo', 'Package Photo')} onUploaded={(path) => setPhotoPath(path)} />
              <Button onClick={createShipment}>
                <Save className="mr-2 h-4 w-4" />
                {tt(language, 'Save Shipment', 'Shipment သိမ်းမည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Merchant Profile', 'Merchant Profile')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div>{safeText(merchant?.merchant_name)}</div>
              <div className="text-sm text-muted-foreground">{safeText(merchant?.contact_name)}</div>
              <div className="text-sm text-muted-foreground">{safeText(merchant?.phone)} · {safeText(merchant?.email)}</div>
              <div className="text-sm text-muted-foreground">{addressText(merchant?.address)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'reports' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Total', 'စုစုပေါင်း')}</div><div className="mt-2 text-4xl font-semibold">{report.total}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Delivered', 'ပို့ပြီး')}</div><div className="mt-2 text-4xl font-semibold">{report.delivered}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Pending', 'စောင့်ဆိုင်း')}</div><div className="mt-2 text-4xl font-semibold">{report.pending}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Revenue', 'ဝင်ငွေ')}</div><div className="mt-2 text-4xl font-semibold">{fmtCurrency(report.revenue)}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'COD', 'COD')}</div><div className="mt-2 text-4xl font-semibold">{fmtCurrency(report.cod)}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Receipts', 'Receipts')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {receipts.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{row.receipt_number}</div>
                    <div className="text-sm text-muted-foreground">{row.period_start} → {row.period_end}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmtCurrency(row.amount)}</div>
                    <div className="text-sm text-muted-foreground">{labelize(row.status)}</div>
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
