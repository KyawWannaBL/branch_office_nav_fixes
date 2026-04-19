// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Truck, UserCheck, Package } from 'lucide-react';
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
  if (pathname.includes('/queue')) return 'queue';
  if (pathname.includes('/fleet')) return 'fleet';
  if (pathname.includes('/exceptions')) return 'exceptions';
  return 'overview';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function statusVariant(status: string) {
  const s = String(status || '').toLowerCase();
  if (['failed', 'cancelled', 'returned'].includes(s)) return 'destructive';
  if (['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s)) return 'secondary';
  if (['delivered'].includes(s)) return 'default';
  return 'outline';
}

export default function SupervisorPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [staffRows, setStaffRows] = useState<any[]>([]);
  const [vehicleRows, setVehicleRows] = useState<any[]>([]);
  const [ackRows, setAckRows] = useState<any[]>([]);

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [d, s, sm, vm, ack] = await Promise.all([
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
        supabase.from('shipments').select('id, awb, status, recipient, cod_amount, expected_delivery_date').order('created_at', { ascending: false }),
        supabase.from('staff_master').select('*').order('full_name', { ascending: true }),
        supabase.from('vehicle_master').select('*').order('vehicle_code', { ascending: true }),
        supabase.from('workflow_acknowledgements').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      if (d.error) throw d.error;
      if (s.error) throw s.error;
      if (sm.error) throw sm.error;
      if (vm.error) throw vm.error;
      if (ack.error) throw ack.error;
      setDeliveries(d.data || []);
      setShipments(s.data || []);
      setStaffRows(sm.data || []);
      setVehicleRows(vm.data || []);
      setAckRows(ack.data || []);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
      setShipments([]);
      setStaffRows([]);
      setVehicleRows([]);
      setAckRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const shipMap = useMemo(() => new Map(shipments.map((s: any) => [s.id, s])), [shipments]);
  const rows = useMemo(() => deliveries.map((d: any) => ({ ...d, shipment: shipMap.get(d.shipment_id) || null })), [deliveries, shipMap]);

  const queueRows = rows.filter((r: any) => !['delivered', 'cancelled'].includes(String(r.status || '').toLowerCase()));
  const exceptionRows = rows.filter((r: any) => ['failed', 'returned', 'cancelled'].includes(String(r.status || '').toLowerCase()) || r.failure_reason);
  const drivers = staffRows.filter((r: any) => ['driver', 'rider'].includes(String(r.staff_type)));

  const bannerKey = view === 'queue' ? 'supervisor_queue' : view === 'fleet' ? 'supervisor_fleet' : view === 'exceptions' ? 'supervisor_exceptions' : 'supervisor';

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(bannerKey)}
        title={
          view === 'queue'
            ? tt(language, 'Supervisor Queue Management', 'Supervisor Queue စီမံခန့်ခွဲမှု')
            : view === 'fleet'
            ? tt(language, 'Supervisor Fleet Mobility', 'Supervisor Fleet Mobility')
            : view === 'exceptions'
            ? tt(language, 'Supervisor Exceptions', 'Supervisor Exceptions')
            : tt(language, 'Supervisor Portal', 'Supervisor Portal')
        }
        subtitle={tt(language, 'Live queue, fleet, and exception visibility with QR responsibility control.', 'QR responsibility control ဖြင့် live queue, fleet နှင့် exception visibility')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-4">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'overview' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/supervisor/overview')}>{tt(language, 'Overview', 'အနှစ်ချုပ်')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'queue' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/supervisor/queue')}>{tt(language, 'Queue', 'Queue')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'fleet' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/supervisor/fleet')}>{tt(language, 'Fleet', 'Fleet')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'exceptions' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/supervisor/exceptions')}>{tt(language, 'Exceptions', 'Exceptions')}</button>
      </div>

      {view === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Queue Size', 'Queue အရွယ်အစား')}</div><div className="mt-2 text-4xl font-semibold">{queueRows.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Exceptions', 'Exceptions')}</div><div className="mt-2 text-4xl font-semibold">{exceptionRows.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Drivers / Riders', 'Driver / Rider')}</div><div className="mt-2 text-4xl font-semibold">{drivers.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">{tt(language, 'Vehicles', 'ယာဉ်များ')}</div><div className="mt-2 text-4xl font-semibold">{vehicleRows.length}</div></CardContent></Card>
        </div>
      )}

      {view === 'queue' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Live Queue', 'Live Queue')}</CardTitle>
              <CardDescription>{tt(language, 'Production deliveries requiring supervisor attention.', 'supervisor ကြည့်ရှုရန်လိုသော production deliveries')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {queueRows.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{safeText(row.shipment?.awb, row.id)}</div>
                      <div className="text-sm text-muted-foreground">{safeText(row.shipment?.recipient?.name)}</div>
                      <div className="text-sm text-muted-foreground">{addressText(row.shipment?.recipient?.address)}</div>
                    </div>
                    <Badge variant={statusVariant(row.status)}>{labelize(row.status)}</Badge>
                  </div>
                  <div className="mt-3">
                    <QrStepActionCard
                      title={tt(language, 'QR Responsibility Step', 'QR Responsibility Step')}
                      processStep="supervisor_queue_review"
                      shipmentId={row.shipment_id}
                      deliveryId={row.id}
                      staffRows={staffRows}
                      onDone={loadData}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Pending Acknowledgements', 'Pending Acknowledgements')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ackRows.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-3">
                  <div className="font-medium">{safeText(row.status)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.responsible_staff_id)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'fleet' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Fleet Mobility', 'Fleet Mobility')}</CardTitle>
            <CardDescription>{tt(language, 'Staff and vehicles from master data.', 'master data မှ staff နှင့် ယာဉ်များ')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              {drivers.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{row.full_name}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.staff_code)} · {safeText(row.phone)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {vehicleRows.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{safeText(row.display_name, row.vehicle_code)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.vehicle_type)} · {safeText(row.registration_no)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'exceptions' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Exception Queue', 'Exception Queue')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exceptionRows.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{safeText(row.shipment?.awb, row.id)}</div>
                    <div className="text-sm text-muted-foreground">{safeText(row.failure_reason || row.notes)}</div>
                  </div>
                  <Badge variant="destructive">{labelize(row.status)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
