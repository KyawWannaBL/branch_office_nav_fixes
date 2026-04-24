// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Save, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { getPortalBanner } from '@/lib/portalBanner';
import { uploadFileToBucket } from '@/lib/storageUpload';
import { PortalBanner } from '@/components/portal/PortalBanner';
import { PhotoUploaderField } from '@/components/workflow/PhotoUploaderField';
import { SignaturePadField } from '@/components/workflow/SignaturePadField';
import { QrStepActionCard } from '@/components/workflow/QrStepActionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function tt(language: string, en: string, mm: string) {
  return language === 'mm' ? mm : en;
}
function currentView(pathname: string) {
  if (pathname.includes('/bulk')) return 'bulk';
  if (pathname.includes('/templates')) return 'templates';
  if (pathname.includes('/records')) return 'records';
  return 'manual';
}
function safeText(value: unknown, fallback = '—') {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

export default function DataEntryPortal() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState(currentView(location.pathname));
  const [loading, setLoading] = useState(true);
  const [staffRows, setStaffRows] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [manualPhoto, setManualPhoto] = useState('');
  const [manualSignature, setManualSignature] = useState('');
  const [form, setForm] = useState({
    awb: '',
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    cod_amount: '0',
    shipping_fee: '0',
    weight: '0',
  });
  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    description: '',
    template_schema: '{"fields":["awb","sender","recipient"]}',
  });

  useEffect(() => setView(currentView(location.pathname)), [location.pathname]);

  async function loadData() {
    setLoading(true);
    try {
      const [staffRes, recordRes, uploadRes, templateRes] = await Promise.all([
        supabase.from('staff_master').select('*').order('full_name', { ascending: true }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('data_entry_uploads').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('data_entry_templates').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (staffRes.error) throw staffRes.error;
      if (recordRes.error) throw recordRes.error;
      if (uploadRes.error) throw uploadRes.error;
      if (templateRes.error) throw templateRes.error;
      setStaffRows(staffRes.data || []);
      setRecords(recordRes.data || []);
      setUploads(uploadRes.data || []);
      setTemplates(templateRes.data || []);
    } catch (e) {
      console.error(e);
      setStaffRows([]);
      setRecords([]);
      setUploads([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function createManualRecord() {
    const { error } = await supabase.from('shipments').insert({
      awb: form.awb,
      status: 'pending',
      sender: {
        name: form.sender_name,
        phone: form.sender_phone,
        address: form.sender_address,
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
        entry_photo_path: manualPhoto || null,
      },
      proof_of_delivery: {
        entry_signature_path: manualSignature || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    setForm({
      awb: '',
      sender_name: '',
      sender_phone: '',
      sender_address: '',
      recipient_name: '',
      recipient_phone: '',
      recipient_address: '',
      cod_amount: '0',
      shipping_fee: '0',
      weight: '0',
    });
    setManualPhoto('');
    setManualSignature('');
    await loadData();
  }

  async function uploadBulkFile(file: File) {
    const { data: auth } = await supabase.auth.getUser();
    const path = await uploadFileToBucket('data-entry-files', file, 'bulk');
    const { error } = await supabase.from('data_entry_uploads').insert({
      original_name: file.name,
      file_path: path,
      content_type: file.type || 'application/octet-stream',
      uploaded_by: auth.user?.id || null,
      status: 'uploaded',
      metadata: { size: file.size },
    });
    if (error) throw error;
    await loadData();
  }

  async function saveTemplate() {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('data_entry_templates').upsert({
      template_name: templateForm.template_name,
      description: templateForm.description || null,
      template_schema: JSON.parse(templateForm.template_schema || '{}'),
      created_by: auth.user?.id || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setTemplateForm({
      template_name: '',
      description: '',
      template_schema: '{"fields":["awb","sender","recipient"]}',
    });
    await loadData();
  }

  const bannerKey = view === 'bulk' ? 'data_entry_bulk' : view === 'records' ? 'data_entry_records' : 'data_entry';

  return (
    <div className="space-y-6">
      <PortalBanner
        image={getPortalBanner(bannerKey)}
        title={tt(language, 'Data Entry Portal', 'Data Entry Portal')}
        subtitle={tt(language, 'Manual entry, bulk upload, templates, and records with photo/signature support.', 'photo/signature support ဖြင့် manual entry, bulk upload, templates နှင့် records')}
      >
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tt(language, 'Refresh', 'ပြန်လည်ရယူမည်')}
        </Button>
      </PortalBanner>

      <div className="grid gap-2 rounded-2xl bg-muted p-1 md:grid-cols-4">
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'manual' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/data-entry/manual')}>{tt(language, 'Manual', 'Manual')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'bulk' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/data-entry/bulk')}>{tt(language, 'Bulk Upload', 'Bulk Upload')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'templates' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/data-entry/templates')}>{tt(language, 'Templates', 'Templates')}</button>
        <button className={`rounded-xl px-4 py-3 text-sm font-semibold ${view === 'records' ? 'bg-background shadow-sm' : ''}`} onClick={() => navigate('/data-entry/records')}>{tt(language, 'Records', 'Records')}</button>
      </div>

      {view === 'manual' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>{tt(language, 'Manual Shipment Entry', 'Manual Shipment Entry')}</CardTitle>
              <CardDescription>{tt(language, 'Create live shipment records without mock/demo data.', 'mock/demo data မသုံးဘဲ live shipment record ဖန်တီးရန်')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="AWB" value={form.awb} onChange={(e) => setForm({ ...form, awb: e.target.value })} />
              <Input placeholder={tt(language, 'Sender Name', 'ပို့သူအမည်')} value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
              <Input placeholder={tt(language, 'Sender Phone', 'ပို့သူဖုန်း')} value={form.sender_phone} onChange={(e) => setForm({ ...form, sender_phone: e.target.value })} />
              <Input placeholder={tt(language, 'Sender Address', 'ပို့သူလိပ်စာ')} value={form.sender_address} onChange={(e) => setForm({ ...form, sender_address: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Name', 'လက်ခံသူအမည်')} value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Phone', 'လက်ခံသူဖုန်း')} value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
              <Input placeholder={tt(language, 'Recipient Address', 'လက်ခံသူလိပ်စာ')} value={form.recipient_address} onChange={(e) => setForm({ ...form, recipient_address: e.target.value })} />
              <Input placeholder={tt(language, 'COD Amount', 'COD ပမာဏ')} value={form.cod_amount} onChange={(e) => setForm({ ...form, cod_amount: e.target.value })} />
              <Input placeholder={tt(language, 'Shipping Fee', 'ပို့ခ')} value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} />
              <Input placeholder={tt(language, 'Weight KG', 'အလေးချိန် KG')} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />

              <PhotoUploaderField label={tt(language, 'Package Photo', 'Package Photo')} onUploaded={(path) => setManualPhoto(path)} />
              <SignaturePadField label={tt(language, 'Entry Signature', 'Entry Signature')} onUploaded={(path) => setManualSignature(path)} />

              <Button onClick={createManualRecord}>
                <Save className="mr-2 h-4 w-4" />
                {tt(language, 'Save Shipment', 'Shipment သိမ်းမည်')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{tt(language, 'QR Process Logging', 'QR Process Logging')}</CardTitle></CardHeader>
            <CardContent>
              <QrStepActionCard
                title={tt(language, 'Record Data Entry Step', 'Data Entry Step မှတ်တမ်းတင်ရန်')}
                processStep="data_entry_manual_create"
                staffRows={staffRows}
                onDone={loadData}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'bulk' && (
        <Card>
          <CardHeader>
            <CardTitle>{tt(language, 'Bulk Upload', 'Bulk Upload')}</CardTitle>
            <CardDescription>{tt(language, 'Upload CSV/XLSX for production back-office processing.', 'production back-office processing အတွက် CSV/XLSX upload လုပ်ရန်')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-3 text-sm">
              <Upload className="h-4 w-4" />
              {tt(language, 'Choose File', 'ဖိုင်ရွေးရန်')}
              <input
                hidden
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadBulkFile(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <div className="space-y-3">
              {uploads.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{row.original_name}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.status)} · {row.file_path}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'templates' && (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Save Template', 'Template သိမ်းရန်')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder={tt(language, 'Template Name', 'Template Name')} value={templateForm.template_name} onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })} />
              <Input placeholder={tt(language, 'Description', 'အကြောင်းအရာ')} value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
              <textarea className="min-h-[160px] w-full rounded-md border p-3 text-sm" value={templateForm.template_schema} onChange={(e) => setTemplateForm({ ...templateForm, template_schema: e.target.value })} />
              <Button onClick={saveTemplate}>{tt(language, 'Save Template', 'Template သိမ်းမည်')}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{tt(language, 'Saved Templates', 'သိမ်းထားသော Template များ')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {templates.map((row: any) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{row.template_name}</div>
                  <div className="text-sm text-muted-foreground">{safeText(row.description)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'records' && (
        <Card>
          <CardHeader><CardTitle>{tt(language, 'Recent Records', 'Recent Records')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {records.map((row: any) => (
              <div key={row.id} className="rounded-xl border p-4">
                <div className="font-semibold">{safeText(row.awb)}</div>
                <div className="text-sm text-muted-foreground">{safeText(row.recipient?.name)} · {safeText(row.recipient?.phone)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
