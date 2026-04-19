// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { addressText, safeText } from '@/lib/displayValue';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { QrStepActionCard } from '@/components/workflow/QrStepActionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}
function currentView(pathname: string) {
  if (pathname.includes('/sorting')) return 'sorting';
  if (pathname.includes('/dispatch')) return 'dispatch';
  return 'inbound';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WarehousePortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [manifests, setManifests] = useState<any[]>([]);
  const [staffRows, setStaffRows] = useState<any[]>([]);

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, m, st] = await Promise.all([
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('manifests').select('*').order('scheduled_date', { ascending: false }),
        supabase.from('staff_master').select('*').order('full_name', { ascending: true }),
      ]);
      if (s.error) throw s.error;
      if (m.error) throw m.error;
      if (st.error) throw st.error;
      setShipments(s.data || []);
      setManifests(m.data || []);
      setStaffRows(st.data || []);
    } catch (e) {
      console.error(e);
      setShipments([]);
      setManifests([]);
      setStaffRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const inboundRows = shipments.filter((r: any) => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(String(r.status)));
  const sortingRows = shipments.filter((r: any) => ['assigned', 'picked_up', 'in_transit'].includes(String(r.status)));
  const dispatchRows = manifests.filter((r: any) => ['draft', 'assigned', 'in_progress'].includes(String(r.status)));

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'sorting' ? 'warehouse_sorting' : view === 'dispatch' ? 'warehouse_dispatch' : 'warehouse')}
        title={tt(language, 'Warehouse Portal', 'Warehouse Portal')}
        subtitle={tt(language, 'Inbound, sorting, dispatch, and QR responsibility flow.', 'inbound, sorting, dispatch နှင့် QR responsibility flow')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-3">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'inbound' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/warehouse/inbound')}>{tt(language, 'Inbound', 'Inbound')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'sorting' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/warehouse/sorting')}>{tt(language, 'Sorting', 'Sorting')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'dispatch' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/warehouse/dispatch')}>{tt(language, 'Dispatch', 'Dispatch')}</button>
      </div>

      {view === 'inbound' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Inbound Intake', 'Inbound Intake')}</CardTitle>
            <CardDescription>{tt(language, 'Incoming shipments for warehouse acceptance.', 'warehouse လက်ခံရန် incoming shipments')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboundRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{safeText(row.awb)}</div>
                    <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)}</div>
                    <div className="text-sm text-muted-foreground">{addressText(row.recipient?.address)}</div>
                  </div>
                  <Badge>{labelize(row.status)}</Badge>
                </div>
                <div className="mt-3">
                  <QrStepActionCard
                    title={tt(language, 'Confirm Inbound Scan', 'Inbound Scan အတည်ပြုရန်')}
                    processStep="warehouse_inbound"
                    shipmentId={row.id}
                    staffRows={staffRows}
                    onDone={loadData}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'sorting' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Sorting Lane', 'Sorting Lane')}</CardTitle>
            <CardDescription>{tt(language, 'Sort by route/zone with QR accountability.', 'route/zone အလိုက် sort လုပ်ပြီး QR accountability ထိန်းရန်')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortingRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="font-semibold">{safeText(row.awb)}</div>
                <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)} · {addressText(row.recipient?.address)}</div>
                <div className="mt-3">
                  <QrStepActionCard
                    title={tt(language, 'Confirm Sorting Step', 'Sorting Step အတည်ပြုရန်')}
                    processStep="warehouse_sorting"
                    shipmentId={row.id}
                    staffRows={staffRows}
                    onDone={loadData}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view === 'dispatch' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Dispatch Staging', 'Dispatch Staging')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dispatchRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{safeText(row.manifest_number)}</div>
                    <div className="text-sm text-muted-foreground">{labelize(row.status)}</div>
                  </div>
                  <Badge>{labelize(row.status)}</Badge>
                </div>
                <div className="mt-3">
                  <QrStepActionCard
                    title={tt(language, 'Dispatch Release Step', 'Dispatch Release Step')}
                    processStep="warehouse_dispatch"
                    manifestId={row.id}
                    staffRows={staffRows}
                    onDone={loadData}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
