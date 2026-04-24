// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { safeText } from '@/lib/displayValue';
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
  if (pathname.includes('/chat')) return 'chat';
  return 'requests';
}
function labelize(value: unknown) {
  return String(value || 'unknown').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerServicePortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [staffRows, setStaffRows] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [attachmentPath, setAttachmentPath] = useState('');
  const [ticketForm, setTicketForm] = useState({
    shipment_id: '',
    category: 'general',
    priority: 'normal',
    subject: '',
    description: '',
    assigned_staff_id: '',
  });
  const [messageText, setMessageText] = useState('');

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [staffRes, shipRes, ticketRes, threadRes, msgRes] = await Promise.all([
        supabase.from('staff_master').select('*').order('full_name', { ascending: true }),
        supabase.from('shipments').select('id, awb, recipient').order('created_at', { ascending: false }).limit(100),
        supabase.from('customer_support_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_chat_threads').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_chat_messages').select('*').order('created_at', { ascending: true }),
      ]);
      if (staffRes.error) throw staffRes.error;
      if (shipRes.error) throw shipRes.error;
      if (ticketRes.error) throw ticketRes.error;
      if (threadRes.error) throw threadRes.error;
      if (msgRes.error) throw msgRes.error;
      setStaffRows(staffRes.data || []);
      setShipments(shipRes.data || []);
      setTickets(ticketRes.data || []);
      setThreads(threadRes.data || []);
      setMessages(msgRes.data || []);
      if (!selectedThreadId && threadRes.data?.length) setSelectedThreadId(threadRes.data[0].id);
    } catch (e) {
      console.error(e);
      setStaffRows([]);
      setShipments([]);
      setTickets([]);
      setThreads([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const shipMap = useMemo(() => new Map(shipments.map((s: any) => [s.id, s])), [shipments]);
  const threadMap = useMemo(() => new Map(threads.map((t: any) => [t.id, t])), [threads]);
  const selectedMessages = useMemo(() => messages.filter((m: any) => m.thread_id === selectedThreadId), [messages, selectedThreadId]);

  async function createTicket() {
    const { data: auth } = await supabase.auth.getUser();

    const { data: ticket, error } = await supabase
      .from('customer_support_tickets')
      .insert({
        shipment_id: ticketForm.shipment_id || null,
        created_by_role: 'customer-service',
        channel: 'portal',
        category: ticketForm.category,
        priority: ticketForm.priority,
        status: 'open',
        subject: ticketForm.subject,
        description: ticketForm.description,
        assigned_staff_id: ticketForm.assigned_staff_id || null,
        attachments: attachmentPath ? [attachmentPath] : [],
      })
      .select()
      .single();

    if (error) throw error;

    const threadRes = await supabase
      .from('customer_chat_threads')
      .insert({
        ticket_id: ticket.id,
        shipment_id: ticket.shipment_id,
        customer_auth_user_id: auth.user?.id || null,
        assigned_staff_id: ticket.assigned_staff_id || null,
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (threadRes.error) throw threadRes.error;

    setTicketForm({
      shipment_id: '',
      category: 'general',
      priority: 'normal',
      subject: '',
      description: '',
      assigned_staff_id: '',
    });
    setAttachmentPath('');
    await loadData();
    setSelectedThreadId(threadRes.data.id);
  }

  async function sendMessage() {
    if (!selectedThreadId || !messageText.trim()) return;
    const { data: auth } = await supabase.auth.getUser();

    const { error } = await supabase.from('customer_chat_messages').insert({
      thread_id: selectedThreadId,
      sender_auth_user_id: auth.user?.id || null,
      sender_role: 'customer-service',
      message_text: messageText.trim(),
      attachments: [],
    });
    if (error) throw error;

    await supabase.from('customer_chat_threads').update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedThreadId);

    setMessageText('');
    await loadData();
  }

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(view === 'chat' ? 'customer_service_chat' : 'customer_service')}
        title={tt(language, 'Customer Service', 'Customer Service')}
        subtitle={tt(language, 'Requests and live chat workflows.', 'request နှင့် live chat workflow များ')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-2">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'requests' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/customer-service/requests')}>{tt(language, 'Requests', 'Requests')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'chat' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/customer-service/chat')}>{tt(language, 'Live Chat', 'Live Chat')}</button>
      </div>

      {view === 'requests' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Create Support Ticket', 'Support Ticket ဖန်တီးရန်')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={ticketForm.shipment_id} onChange={(e) => setTicketForm({ ...ticketForm, shipment_id: e.target.value })}>
                <option value="">{tt(language, 'Select Shipment', 'Shipment ရွေးပါ')}</option>
                {shipments.map((row: any) => <option key={row.id} value={row.id}>{row.awb} · {safeText(row.recipient?.name)}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}>
                <option value="general">General</option>
                <option value="delivery_delay">Delivery Delay</option>
                <option value="damage">Damage</option>
                <option value="wrong_address">Wrong Address</option>
                <option value="payment">Payment</option>
              </select>
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select className="h-10 w-full rounded-md border px-3 text-sm" value={ticketForm.assigned_staff_id} onChange={(e) => setTicketForm({ ...ticketForm, assigned_staff_id: e.target.value })}>
                <option value="">{tt(language, 'Assign Staff', 'Staff ရွေးပါ')}</option>
                {staffRows.map((row: any) => <option key={row.id} value={row.id}>{row.full_name}</option>)}
              </select>
              <Input placeholder={tt(language, 'Subject', 'ခေါင်းစဉ်')} value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} />
              <textarea className="min-h-[120px] w-full rounded-md border p-3 text-sm" placeholder={tt(language, 'Description', 'အသေးစိတ်')} value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} />
              <PhotoUploaderField label={tt(language, 'Attachment', 'ပူးတွဲဖိုင်')} onUploaded={(path) => setAttachmentPath(path)} />
              <Button onClick={createTicket}>{tt(language, 'Create Ticket', 'Ticket ဖန်တီးမည်')}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Ticket Queue', 'Ticket Queue')}</CardTitle>
            </CardHeader>
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

      {view === 'chat' && (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Threads', 'Threads')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {threads.map((row: any) => (
                <button key={row.id} type="button" className={`w-full rounded-xl border p-3 text-left ${selectedThreadId === row.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedThreadId(row.id)}>
                  <div className="font-medium">{threadMap.get(row.id)?.ticket_id || row.id}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.status)}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'Conversation', 'Conversation')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {selectedMessages.map((row: any) => (
                  <div key={row.id} className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">{safeText(row.sender_role)}</div>
                    <div className="mt-1">{safeText(row.message_text)}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder={tt(language, 'Type message', 'Message ရိုက်ထည့်ပါ')} />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
