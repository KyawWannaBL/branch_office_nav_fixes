// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Send } from 'lucide-react';
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
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/support')) return 'support';
  return 'track';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [trackQuery, setTrackQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [attachmentPath, setAttachmentPath] = useState('');
  const [supportForm, setSupportForm] = useState({
    shipment_id: '',
    subject: '',
    description: '',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();

      const [shipRes, eventRes, ticketRes] = await Promise.all([
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('qr_scan_events').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_support_tickets').select('*').eq('customer_auth_user_id', auth.user?.id || '').order('created_at', { ascending: false }),
      ]);

      if (shipRes.error) throw shipRes.error;
      if (eventRes.error) throw eventRes.error;
      if (ticketRes.error) throw ticketRes.error;

      const filtered = (shipRes.data || []).filter((row: any) =>
        row.customer_auth_user_id === auth.user?.id ||
        row.recipient?.email === auth.user?.email
      );

      setShipments(filtered);
      setEvents(eventRes.data || []);
      setTickets(ticketRes.data || []);
      if (!selectedShipmentId && filtered.length) setSelectedShipmentId(filtered[0].id);
    } catch (e) {
      console.error(e);
      setShipments([]);
      setEvents([]);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const trackedShipment = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) return shipments.find((s: any) => s.id === selectedShipmentId) || null;
    return shipments.find((s: any) => String(s.awb || '').toLowerCase() === q) || null;
  }, [shipments, selectedShipmentId, trackQuery]);

  const timeline = useMemo(() => {
    if (!trackedShipment) return [];
    return events.filter((e: any) => e.shipment_id === trackedShipment.id);
  }, [events, trackedShipment]);

  async function createSupportTicket() {
    const { data: auth } = await supabase.auth.getUser();

    const { error } = await supabase.from('customer_support_tickets').insert({
      shipment_id: supportForm.shipment_id || null,
      customer_auth_user_id: auth.user?.id || null,
      created_by_role: 'customer',
      channel: 'portal',
      category: 'general',
      priority: 'normal',
      status: 'open',
      subject: supportForm.subject,
      description: supportForm.description,
      attachments: attachmentPath ? [attachmentPath] : [],
    });

    if (error) throw error;

    setSupportForm({
      shipment_id: '',
      subject: '',
      description: '',
    });
    setAttachmentPath('');
    await loadData();
  }

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'orders' ? 'customer_orders' : view === 'support' ? 'customer_support' : 'customer')}
        title={tt(language, 'Customer Portal', 'Customer Portal')}
        subtitle={tt(language, 'Tracking, orders, and support.', 'tracking, order နှင့် support')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-3">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'track' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/customer/track')}>{tt(language, 'Track Shipment', 'Track Shipment')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'orders' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/customer/orders')}>{tt(language, 'My Orders', 'My Orders')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'support' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/customer/support')}>{tt(language, 'Support', 'Support')}</button>
      </div>

      {view === 'track' && (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Track by AWB', 'AWB ဖြင့် Track လုပ်ရန်')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="AWB" value={trackQuery} onChange={(e) => setTrackQuery(e.target.value)} />
              </div>
              {shipments.map((row: any) => (
                <button key={row.id} type="button" className={`w-full rounded-xl border p-3 text-left ${selectedShipmentId === row.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedShipmentId(row.id)}>
                  <div className="font-medium">{safeText(row.awb)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Shipment Timeline', 'Shipment Timeline')}</CardTitle>
              <CardDescription>{trackedShipment ? safeText(trackedShipment.awb) : tt(language, 'No shipment selected', 'shipment မရွေးထားပါ')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trackedShipment && (
                <div className="rounded-xl border p-4">
                  <div className="font-semibold">{safeText(trackedShipment.recipient?.name)}</div>
                  <div className="text-sm text-muted-foreground">{addressText(trackedShipment.recipient?.address)}</div>
                  <div className="mt-2"><Badge>{labelize(trackedShipment.status)}</Badge></div>
                </div>
              )}
              {timeline.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="font-medium">{safeText(row.process_step)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.territory_code)} · {safeText(row.scan_channel)}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.notes)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'orders' && (
        <Card>
          <CardHeader><CardTitle>{tt(language, 'My Orders', 'My Orders')}</CardTitle></CardHeader>
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

      {view === 'support' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Create Support Request', 'Support Request ဖန်တီးရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={supportForm.shipment_id} onChange={(e) => setSupportForm({ ...supportForm, shipment_id: e.target.value })}>
                <option value="">{tt(language, 'Select Shipment', 'Shipment ရွေးပါ')}</option>
                {shipments.map((row: any) => <option key={row.id} value={row.id}>{row.awb} · {safeText(row.recipient?.name)}</option>)}
              </select>
              <Input placeholder={tt(language, 'Subject', 'ခေါင်းစဉ်')} value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })} />
              <textarea className="min-h-[120px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Description', 'အသေးစိတ်')} value={supportForm.description} onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })} />
              <PhotoUploaderField label={tt(language, 'Attachment', 'ပူးတွဲဖိုင်')} onUploaded={(path) => setAttachmentPath(path)} />
              <Button onClick={createSupportTicket}>
                <Send className="mr-2 h-4 w-4" />
                {tt(language, 'Submit', 'တင်ပို့မည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'My Tickets', 'ကျွန်ုပ်၏ Ticket များ')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{row.ticket_number}</div>
                      <div className="text-sm text-muted-foreground">{safeText(row.subject)}</div>
                      <div className="text-sm text-muted-foreground">{safeText(row.description)}</div>
                    </div>
                    <Badge>{labelize(row.status)}</Badge>
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
