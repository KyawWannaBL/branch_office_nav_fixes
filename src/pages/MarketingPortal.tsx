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
  if (pathname.includes('/campaigns')) return 'campaigns';
  if (pathname.includes('/merchants')) return 'merchants';
  return 'overview';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtCurrency(value: unknown) {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(num) ? num : 0)} MMK`;
}

export default function MarketingPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [campaignRows, setCampaignRows] = useState<any[]>([]);
  const [merchantRows, setMerchantRows] = useState<any[]>([]);
  const [shipmentRows, setShipmentRows] = useState<any[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    campaign_code: '',
    title: '',
    channel: 'sms',
    status: 'draft',
    budget: '0',
    notes: '',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, mRes, sRes] = await Promise.all([
        supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('merchant_profiles').select('*').order('merchant_name', { ascending: true }),
        supabase.from('shipments').select('id, merchant_profile_id, status, shipping_fee').order('created_at', { ascending: false }),
      ]);
      if (cRes.error) throw cRes.error;
      if (mRes.error) throw mRes.error;
      if (sRes.error) throw sRes.error;
      setCampaignRows(cRes.data || []);
      setMerchantRows(mRes.data || []);
      setShipmentRows(sRes.data || []);
    } catch (e) {
      console.error(e);
      setCampaignRows([]);
      setMerchantRows([]);
      setShipmentRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function saveCampaign() {
    const { error } = await supabase.from('marketing_campaigns').upsert({
      campaign_code: campaignForm.campaign_code,
      title: campaignForm.title,
      channel: campaignForm.channel,
      status: campaignForm.status,
      budget: Number(campaignForm.budget || 0),
      notes: campaignForm.notes || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setCampaignForm({
      campaign_code: '',
      title: '',
      channel: 'sms',
      status: 'draft',
      budget: '0',
      notes: '',
    });
    await loadData();
  }

  const stats = useMemo(() => {
    const totalCampaigns = campaignRows.length;
    const activeCampaigns = campaignRows.filter((r: any) => String(r.status) === 'active').length;
    const totalBudget = campaignRows.reduce((sum: number, r: any) => sum + Number(r.budget || 0), 0);
    const activeMerchants = merchantRows.filter((r: any) => r.is_active).length;
    return { totalCampaigns, activeCampaigns, totalBudget, activeMerchants };
  }, [campaignRows, merchantRows]);

  const merchantShipmentMap = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    shipmentRows.forEach((row: any) => {
      const key = row.merchant_profile_id;
      if (!key) return;
      if (!map.has(key)) map.set(key, { count: 0, revenue: 0 });
      const v = map.get(key)!;
      v.count += 1;
      v.revenue += Number(row.shipping_fee || 0);
    });
    return map;
  }, [shipmentRows]);

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'campaigns' ? 'marketing_campaigns' : view === 'merchants' ? 'marketing_merchants' : 'marketing')}
        title={tt(language, 'Marketing Portal', 'Marketing Portal')}
        subtitle={tt(language, 'Overview, campaigns, and merchant growth visibility.', 'overview, campaign နှင့် merchant growth visibility')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-3">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'overview' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/marketing/overview')}>{tt(language, 'Overview', 'Overview')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'campaigns' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/marketing/campaigns')}>{tt(language, 'Campaigns', 'Campaigns')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'merchants' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/marketing/merchants')}>{tt(language, 'Merchants', 'Merchants')}</button>
      </div>

      {view === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Campaigns', 'Campaigns')}</div><div className="mt-2 text-4xl font-semibold">{stats.totalCampaigns}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Active', 'Active')}</div><div className="mt-2 text-4xl font-semibold">{stats.activeCampaigns}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Budget', 'Budget')}</div><div className="mt-2 text-4xl font-semibold">{fmtCurrency(stats.totalBudget)}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Active Merchants', 'Active Merchant')}</div><div className="mt-2 text-4xl font-semibold">{stats.activeMerchants}</div></CardContent></Card>
        </div>
      )}

      {view === 'campaigns' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Create Campaign', 'Campaign ဖန်တီးရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder={tt(language, 'Campaign Code', 'Campaign Code')} value={campaignForm.campaign_code} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_code: e.target.value })} />
              <Input placeholder={tt(language, 'Title', 'ခေါင်းစဉ်')} value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} />
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={campaignForm.channel} onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="telegram">Telegram</option>
                <option value="viber">Viber</option>
                <option value="mixed">Mixed</option>
              </select>
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input placeholder={tt(language, 'Budget', 'Budget')} value={campaignForm.budget} onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })} />
              <textarea className="min-h-[100px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Notes', 'မှတ်ချက်')} value={campaignForm.notes} onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })} />
              <Button onClick={saveCampaign}>
                <Save className="mr-2 h-4 w-4" />
                {tt(language, 'Save Campaign', 'Campaign သိမ်းမည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Campaign List', 'Campaign List')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {campaignRows.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{row.title}</div>
                    <div className="text-sm text-muted-foreground">{safeText(row.campaign_code)} · {safeText(row.channel)}</div>
                    <div className="text-sm text-muted-foreground">{fmtCurrency(row.budget)}</div>
                  </div>
                  <Badge>{labelize(row.status)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'merchants' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Merchant Growth Table', 'Merchant Growth Table')}</CardTitle>
            <CardDescription>{tt(language, 'Merchant counts and shipment revenue visibility.', 'merchant count နှင့် shipment revenue visibility')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {merchantRows.map((row: any) => {
              const stat = merchantShipmentMap.get(row.id) || { count: 0, revenue: 0 };
              return (
                <div key={row.id} className="rounded-xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{row.merchant_name}</div>
                    <div className="text-sm text-muted-foreground">{safeText(row.contact_name)} · {safeText(row.phone)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{stat.count} {tt(language, 'shipments', 'shipment')}</div>
                    <div className="text-sm text-muted-foreground">{fmtCurrency(stat.revenue)}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
