import React, { useMemo, useRef, useState } from 'react';
import { useCreatePickup, useCreateShipment, usePickups } from '../hooks/useApi';
import { CITY_OPTIONS, findPartyByBusinessName, getTownshipsByCity, searchPartyProfiles } from '../lib/masterData';

type SourceType = 'MER' | 'CUS' | 'OS' | 'DEO';
type PayStatus = 'PAID' | 'UNPAID';
type Mode = 'merchant' | 'data_entry';

type PickupForm = {
  pickupDate: string;
  sourceType: SourceType;
  businessName: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupTownship: string;
  totalWays: string;
};

type DeliveryRow = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverTownship: string;
  weightKg: string;
  codAmount: string;
  serviceType: string;
  itemPaymentStatus: PayStatus;
  deliveryPaymentStatus: PayStatus;
  merchantCharge: string;
  notes: string;
  evidenceName: string;
};

const serviceOptions = ['standard', 'express', 'same_day', 'cod_express'];
const baseCard: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, boxShadow: '0 10px 24px rgba(15,23,42,.04)' };
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit' };

const initPickup = (mode: Mode): PickupForm => ({
  pickupDate: new Date().toISOString().slice(0, 10),
  sourceType: mode === 'data_entry' ? 'DEO' : 'MER',
  businessName: '',
  contactName: '',
  contactPhone: '',
  pickupAddress: '',
  pickupCity: 'Yangon',
  pickupTownship: '',
  totalWays: '1'
});

const initRow = (): DeliveryRow => ({
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  receiverCity: 'Yangon',
  receiverTownship: '',
  weightKg: '3',
  codAmount: '0',
  serviceType: 'standard',
  itemPaymentStatus: 'UNPAID',
  deliveryPaymentStatus: 'UNPAID',
  merchantCharge: '0',
  notes: '',
  evidenceName: ''
});

const fmtDateToken = (d: string) => {
  const p = (d || '').split('-');
  return `${p[1] || '00'}${p[2] || '00'}`;
};

const abbr = (s: string, fallback = 'GEN') => {
  const w = String(s || '').replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return fallback;
  if (w.length === 1) return w[0].slice(0, 3).toUpperCase().padEnd(3, 'X');
  return w.slice(0, 3).map((x) => x[0]).join('').toUpperCase().padEnd(3, 'X');
};

const seq = (x: any) => {
  const m = String(x?.pickup_id || x?.pickup_way_id || x?.pickupId || '').match(/-(\d{3,4})$/);
  return m ? Number(m[1]) : 0;
};

const money = (n: number) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n || 0)} MMK`;

function pricing(r: DeliveryRow) {
  const weight = Number(r.weightKg || 0);
  const cod = Number(r.codAmount || 0);
  const merchant = Number(r.merchantCharge || 0);
  const baseMap: Record<string, number> = {
    standard: 4000,
    express: 5000,
    same_day: 6000,
    cod_express: 6500
  };
  const base = baseMap[r.serviceType] || 4000;
  const surcharge = Math.max(0, weight - 3) * 2500;
  const os = base + surcharge;
  const wb = Math.max(os, merchant);
  const item = r.itemPaymentStatus === 'UNPAID' ? cod : 0;
  const osCharge = r.deliveryPaymentStatus === 'UNPAID' ? os : 0;
  const wbCharge = r.deliveryPaymentStatus === 'UNPAID' ? wb : 0;
  return {
    os,
    wb,
    surcharge,
    osTotal: item + osCharge,
    wbTotal: item + wbCharge,
    receivable: item + osCharge
  };
}

const csvEscape = (v: string | number) => `"${String(v ?? '').split('"').join('""')}"`;

const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [] as Record<string, string>[];
  const head = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(head.map((h, i) => [h, cols[i] || '']));
  });
};

function FormField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label style={{ ...fieldStyle, gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </label>
  );
}

function InfoChip({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: '1px solid #dbe4ee', borderRadius: 16, padding: '12px 14px', background: '#f8fafc', minWidth: 180 }}>
      <div style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{title}</div>
      <div style={{ fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ ...baseCard, padding: 14, borderRadius: 18, transform: strong ? 'translateY(-2px)' : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: strong ? '#0f172a' : '#0f766e' }}>{value}</div>
    </div>
  );
}

function SuggestionPanel({ title, items, fallback }: { title: string; items: { key: string; label: string; onClick: () => void }[]; fallback: string }) {
  return (
    <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '.04em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {items.length
          ? items.map((item) => (
              <button key={item.key} style={{ border: '1px solid #cbd5e1', borderRadius: 999, background: '#fff', padding: '8px 12px', cursor: 'pointer', fontWeight: 700, color: '#334155', fontSize: 12 }} onClick={item.onClick}>
                {item.label}
              </button>
            ))
          : <span style={{ color: '#64748b', fontSize: 13 }}>{fallback}</span>}
      </div>
    </div>
  );
}

export default function EnterpriseCreateDeliveryWorkspace({ mode, accent = '#0f766e' }: { mode: Mode; accent?: string }) {
  const [pickup, setPickup] = useState<PickupForm>(initPickup(mode));
  const [rows, setRows] = useState<DeliveryRow[]>([initRow()]);
  const [pane, setPane] = useState<'pickup' | 'delivery'>('pickup');
  const [selected, setSelected] = useState(0);
  const [msg, setMsg] = useState('');
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const createPickup = useCreatePickup();
  const createShipment = useCreateShipment();
  const pickups = usePickups({ limit: '200' });

  const pickupList = Array.isArray(pickups.data) ? (pickups.data as any[]) : [];
  const current = rows[selected] || initRow();

  const senderMatches = useMemo(() => searchPartyProfiles(pickup.businessName, mode === 'merchant' ? 'merchant' : undefined).slice(0, 6), [pickup.businessName, mode]);
  const receiverMatches = useMemo(() => searchPartyProfiles(current.receiverName, 'customer').slice(0, 6), [current.receiverName]);

  const pickupId = useMemo(() => {
    const org = abbr(pickup.businessName || pickup.contactName || pickup.sourceType, pickup.sourceType);
    const token = fmtDateToken(pickup.pickupDate);
    const max = pickupList
      .filter((r) => String(r?.pickup_id || r?.pickup_way_id || r?.pickupId || '').startsWith(`P${token}-${org}-`))
      .reduce((m, r) => Math.max(m, seq(r)), 0);
    return `P${token}-${org}-${String(max + 1).padStart(3, '0')}`;
  }, [pickup, pickupList]);

  const deliveryIds = useMemo(
    () => rows.map((_, i) => `D${fmtDateToken(pickup.pickupDate)}-${abbr(pickup.businessName || pickup.contactName || pickup.sourceType, pickup.sourceType)}-${String(i + 1).padStart(3, '0')}`),
    [rows, pickup]
  );

  const calc = useMemo(() => pricing(current), [current]);

  const setPickupField = (key: keyof PickupForm, value: string) => {
    setPickup((p) => ({ ...p, [key]: value }));
    if (key === 'totalWays') {
      const count = Math.max(1, Number(value || 1));
      setRows((prev) => {
        const next = [...prev];
        while (next.length < count) next.push(initRow());
        next.length = count;
        return next;
      });
      setSelected((prev) => Math.min(prev, count - 1));
    }
  };

  const setRow = (patch: Partial<DeliveryRow>) => {
    setRows((prev) => prev.map((r, i) => (i === selected ? { ...r, ...patch } : r)));
  };

  const fillSender = (name: string) => {
    const found = findPartyByBusinessName(name);
    if (!found) return;
    setPickup((p) => ({
      ...p,
      businessName: found.businessName,
      contactName: found.contactName,
      contactPhone: found.phone,
      pickupAddress: found.address,
      pickupCity: found.city,
      pickupTownship: found.township
    }));
  };

  const fillReceiver = (name: string) => {
    const found = findPartyByBusinessName(name);
    if (!found) return;
    setRow({
      receiverName: found.businessName,
      receiverPhone: found.phone,
      receiverAddress: found.address,
      receiverCity: found.city,
      receiverTownship: found.township
    });
  };

  const downloadTemplate = () => {
    const head = ['receiver_name', 'receiver_phone', 'receiver_address', 'receiver_city', 'receiver_township', 'weight_kg', 'cod_amount', 'service_type', 'item_payment_status', 'delivery_payment_status', 'merchant_charge', 'notes'];
    const sample = ['Example Receiver', '09 000 000 000', 'No. 1 Example Road', 'Yangon', 'Lanmadaw', 3, 80000, 'standard', 'UNPAID', 'UNPAID', 2500, ''];
    const csv = [head.map(csvEscape).join(','), sample.map(csvEscape).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pickupId}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadCsv = async (file: File) => {
    const parsed = parseCsv(await file.text());
    if (!parsed.length) return setMsg('CSV file is empty or invalid.');
    const next: DeliveryRow[] = parsed.map((r) => ({
      receiverName: r.receiver_name || '',
      receiverPhone: r.receiver_phone || '',
      receiverAddress: r.receiver_address || '',
      receiverCity: r.receiver_city || 'Yangon',
      receiverTownship: r.receiver_township || '',
      weightKg: r.weight_kg || '3',
      codAmount: r.cod_amount || '0',
      serviceType: r.service_type || 'standard',
      itemPaymentStatus: (r.item_payment_status === 'PAID' ? 'PAID' : 'UNPAID') as PayStatus,
      deliveryPaymentStatus: (r.delivery_payment_status === 'PAID' ? 'PAID' : 'UNPAID') as PayStatus,
      merchantCharge: r.merchant_charge || '0',
      notes: r.notes || '',
      evidenceName: ''
    }));
    setRows(next);
    setPickupField('totalWays', String(next.length));
    setSelected(0);
    setMsg(`Loaded ${next.length} delivery record(s) from CSV.`);
  };

  const saveWorkspace = async () => {
    setMsg('');
    try {
      await createPickup.mutateAsync({
        pickup_id: pickupId,
        pickup_date: pickup.pickupDate,
        pickup_window: 'enterprise',
        parcel_count: Math.max(1, Number(pickup.totalWays || 1)),
        merchant_name: pickup.businessName,
        merchant_phone: pickup.contactPhone,
        pickup_address: pickup.pickupAddress,
        pickup_township: pickup.pickupTownship,
        pickup_city: pickup.pickupCity,
        contact_name: pickup.contactName,
        source_type: pickup.sourceType
      } as Record<string, unknown>);

      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        const c = pricing(r);
        await createShipment.mutateAsync({
          sender_name: pickup.contactName || pickup.businessName,
          sender_phone: pickup.contactPhone,
          sender_address: pickup.pickupAddress,
          receiver_name: r.receiverName,
          receiver_phone: r.receiverPhone,
          receiver_address: r.receiverAddress,
          receiver_township: r.receiverTownship,
          receiver_city: r.receiverCity,
          cod_amount: Number(r.codAmount || 0),
          service_type: r.serviceType,
          notes: [`pickup_id=${pickupId}`, `delivery_id=${deliveryIds[i]}`, `os_charge=${c.os}`, `waybill_charge=${c.wb}`, `receivable=${c.receivable}`, r.notes].filter(Boolean).join(' | ')
        } as Record<string, unknown>);
      }

      setMsg(`Saved ${pickupId} with ${rows.length} delivery way(s).`);
      pickups.refetch();
    } catch (e: any) {
      setMsg(e?.message || 'Failed to save pickup and delivery records.');
    }
  };

  const printPack = () => {
    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return;
    const html = rows.map((r, i) => {
      const c = pricing(r);
      const blocks = Array.from({ length: 49 }).map((_, j) => {
        const on = (deliveryIds[i].charCodeAt(j % deliveryIds[i].length) + j) % 3 === 0;
        return `<div style="height:16px;background:${on ? '#0f172a' : '#f8fafc'};border:1px solid #cbd5e1"></div>`;
      }).join('');
      return `<section style="border:1px solid #dbe4ee;border-radius:18px;padding:18px;margin-bottom:18px;font-family:Segoe UI,sans-serif;"><div style="display:flex;justify-content:space-between;gap:24px;"><div style="flex:1;"><div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.14em;">Britium Express Waybill</div><div style="font-size:22px;font-weight:900;color:#0f172a;margin-top:8px;">${deliveryIds[i]}</div><div style="margin-top:8px;font-size:14px;color:#334155;"><strong>Pickup:</strong> ${pickupId}</div><div style="font-size:14px;color:#334155;"><strong>Merchant:</strong> ${pickup.businessName}</div><div style="font-size:14px;color:#334155;"><strong>Receiver:</strong> ${r.receiverName}</div><div style="font-size:14px;color:#334155;"><strong>Phone:</strong> ${r.receiverPhone}</div><div style="font-size:14px;color:#334155;"><strong>Address:</strong> ${r.receiverAddress}</div><div style="font-size:14px;color:#334155;"><strong>Waybill Charge:</strong> ${money(c.wb)}</div><div style="font-size:14px;color:#334155;"><strong>Total COD:</strong> ${money(c.wbTotal)}</div></div><div style="width:220px;"><div style="border:2px solid #0f172a;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;">Scan Token</div><div style="margin-top:10px;font-size:17px;font-weight:900;color:#0f172a;word-break:break-word;">${deliveryIds[i]}</div><div style="margin-top:12px;display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${blocks}</div></div></div></div></section>`;
    }).join('');
    w.document.write(`<html><head><title>${pickupId} labels</title></head><body style="padding:24px;background:#fff;">${html}<script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...baseCard, border: 'none', borderRadius: 26, padding: 24, color: '#fff', background: `linear-gradient(135deg, ${accent} 0%, #0f172a 100%)`, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 18 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Enterprise Create Delivery</div>
          <div style={{ marginTop: 16, fontSize: 32, fontWeight: 900, lineHeight: 1.1 }}>Pickup and Delivery Registration Workspace</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,.85)' }}>Separated containers, guided master-data suggestions, controlled city and township values, and auto-generated Pickup and Delivery IDs.</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .82 }}>Generated Pickup ID</div>
          <div style={{ marginTop: 10, fontSize: 26, fontWeight: 900, wordBreak: 'break-word' }}>{pickupId}</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: .78 }}>Next daily sequence based on registered pickup records.</div>
        </div>
      </div>

      <div style={{ ...baseCard, display: 'flex', gap: 8, padding: 8 }}>
        <button style={pane === 'pickup' ? { ...segActive, background: accent } : seg} onClick={() => setPane('pickup')}>Pickup Container</button>
        <button style={pane === 'delivery' ? { ...segActive, background: accent } : seg} onClick={() => setPane('delivery')}>Delivery Container</button>
      </div>

      {msg ? <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0f766e', padding: '12px 14px', borderRadius: 16, fontSize: 13, fontWeight: 600 }}>{msg}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px,.95fr) minmax(0,1.25fr)', gap: 18 }}>
        <section style={{ ...baseCard, padding: 20 }}>
          <div style={headRow}>
            <div>
              <div style={hTitle}>📅 Pickup Registration</div>
              <div style={hSub}>Auto-generates the Pickup ID after date and sender information are filled.</div>
            </div>
            <button style={ghost} onClick={downloadTemplate}>⬇ Template</button>
          </div>

          <div style={grid2}>
            <FormField label="Pickup Date"><input type="date" style={inputStyle} value={pickup.pickupDate} onChange={(e) => setPickupField('pickupDate', e.target.value)} /></FormField>
            <FormField label="Source Type"><select style={inputStyle} value={pickup.sourceType} onChange={(e) => setPickupField('sourceType', e.target.value as SourceType)}><option value="MER">Merchant</option><option value="CUS">Customer</option><option value="OS">Online Store</option><option value="DEO">Data Entry</option></select></FormField>
            <FormField label="Business / Sender Name"><input style={inputStyle} list="sender-master" value={pickup.businessName} onChange={(e) => { setPickupField('businessName', e.target.value); fillSender(e.target.value); }} /></FormField>
            <FormField label="Contact Name"><input style={inputStyle} value={pickup.contactName} onChange={(e) => setPickupField('contactName', e.target.value)} /></FormField>
            <FormField label="Phone Number"><input style={inputStyle} value={pickup.contactPhone} onChange={(e) => setPickupField('contactPhone', e.target.value)} /></FormField>
            <FormField label="Pickup City"><select style={inputStyle} value={pickup.pickupCity} onChange={(e) => setPickupField('pickupCity', e.target.value)}>{CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></FormField>
            <FormField label="Pickup Township"><select style={inputStyle} value={pickup.pickupTownship} onChange={(e) => setPickupField('pickupTownship', e.target.value)}><option value="">Select township</option>{getTownshipsByCity(pickup.pickupCity).map((t) => <option key={t} value={t}>{t}</option>)}</select></FormField>
            <FormField label="Total Ways"><input type="number" min={1} style={inputStyle} value={pickup.totalWays} onChange={(e) => setPickupField('totalWays', e.target.value)} /></FormField>
            <FormField label="Pickup Address" wide><textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={pickup.pickupAddress} onChange={(e) => setPickupField('pickupAddress', e.target.value)} /></FormField>
          </div>

          <SuggestionPanel
            title="🔎 Suggested master-data matches"
            items={senderMatches.map((m) => ({ key: m.id, label: `${m.businessName} · ${m.township}`, onClick: () => fillSender(m.businessName) }))}
            fallback="Start typing a registered sender name."
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button style={{ ...primary, background: accent }} onClick={saveWorkspace}>💾 Save Workspace</button>
            <button style={secondary} onClick={() => uploadRef.current?.click()}>📤 Upload CSV</button>
            <input ref={uploadRef} hidden type="file" accept=".csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadCsv(file); }} />
          </div>

          <datalist id="sender-master">{searchPartyProfiles('').map((m) => <option key={m.id} value={m.businessName} />)}</datalist>
        </section>

        <section style={{ ...baseCard, padding: 20 }}>
          <div style={headRow}>
            <div>
              <div style={hTitle}>📦 Delivery Data Entry</div>
              <div style={hSub}>Live calculation preview, payment dropdowns, and print-ready labels.</div>
            </div>
            <button style={ghost} onClick={printPack}>🖨 Print Pack</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <InfoChip title="Pickup" value={pickupId} />
            <InfoChip title="Delivery" value={deliveryIds[selected] || '-'} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button style={pagerBtn} onClick={() => setSelected((p) => Math.max(0, p - 1))}>◀</button>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{selected + 1} / {rows.length}</span>
              <button style={pagerBtn} onClick={() => setSelected((p) => Math.min(rows.length - 1, p + 1))}>▶</button>
            </div>
          </div>

          <div style={grid2}>
            <FormField label="Receiver Name"><input style={inputStyle} list="receiver-master" value={current.receiverName} onChange={(e) => { setRow({ receiverName: e.target.value }); fillReceiver(e.target.value); }} /></FormField>
            <FormField label="Receiver Phone"><input style={inputStyle} value={current.receiverPhone} onChange={(e) => setRow({ receiverPhone: e.target.value })} /></FormField>
            <FormField label="Receiver City"><select style={inputStyle} value={current.receiverCity} onChange={(e) => setRow({ receiverCity: e.target.value, receiverTownship: '' })}>{CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></FormField>
            <FormField label="Receiver Township"><select style={inputStyle} value={current.receiverTownship} onChange={(e) => setRow({ receiverTownship: e.target.value })}><option value="">Select township</option>{getTownshipsByCity(current.receiverCity).map((t) => <option key={t} value={t}>{t}</option>)}</select></FormField>
            <FormField label="Weight (Kg)"><input type="number" min={0} style={inputStyle} value={current.weightKg} onChange={(e) => setRow({ weightKg: e.target.value })} /></FormField>
            <FormField label="Service Type"><select style={inputStyle} value={current.serviceType} onChange={(e) => setRow({ serviceType: e.target.value })}>{serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></FormField>
            <FormField label="COD Amount"><input type="number" min={0} style={inputStyle} value={current.codAmount} onChange={(e) => setRow({ codAmount: e.target.value })} /></FormField>
            <FormField label="Merchant Charge"><input type="number" min={0} style={inputStyle} value={current.merchantCharge} onChange={(e) => setRow({ merchantCharge: e.target.value })} /></FormField>
            <FormField label="Item Payment"><select style={inputStyle} value={current.itemPaymentStatus} onChange={(e) => setRow({ itemPaymentStatus: e.target.value as PayStatus })}><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option></select></FormField>
            <FormField label="Delivery Payment"><select style={inputStyle} value={current.deliveryPaymentStatus} onChange={(e) => setRow({ deliveryPaymentStatus: e.target.value as PayStatus })}><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option></select></FormField>
            <FormField label="Evidence Upload">
              <label style={{ border: '1px dashed #94a3b8', borderRadius: 14, background: '#f8fafc', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                📎 {current.evidenceName || 'Attach delivery evidence'}
                <input hidden type="file" accept="image/*" onChange={(e) => setRow({ evidenceName: e.target.files?.[0]?.name || '' })} />
              </label>
            </FormField>
            <FormField label="Receiver Address" wide><textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={current.receiverAddress} onChange={(e) => setRow({ receiverAddress: e.target.value })} /></FormField>
            <FormField label="Internal Notes" wide><textarea style={{ ...inputStyle, minHeight: 76, resize: 'vertical' }} value={current.notes} onChange={(e) => setRow({ notes: e.target.value })} /></FormField>
          </div>

          <SuggestionPanel
            title="📇 Receiver master-data suggestions"
            items={receiverMatches.map((m) => ({ key: m.id, label: `${m.businessName} · ${m.phone}`, onClick: () => fillReceiver(m.businessName) }))}
            fallback="Type receiver information to get quick-fill suggestions."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginTop: 18 }}>
            <Metric label="OS Charge" value={money(calc.os)} />
            <Metric label="Waybill Charge" value={money(calc.wb)} />
            <Metric label="OS Total COD" value={money(calc.osTotal)} />
            <Metric label="Waybill COD" value={money(calc.wbTotal)} />
            <Metric label="Receivable" value={money(calc.receivable)} strong />
            <Metric label="Overweight" value={money(calc.surcharge)} />
          </div>

          <datalist id="receiver-master">{searchPartyProfiles('', 'customer').map((m) => <option key={m.id} value={m.businessName} />)}</datalist>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ ...baseCard, padding: '14px 16px', fontSize: 13, color: '#334155', fontWeight: 600 }}>📍 City and township selectors use predefined values to avoid misspelling and inconsistent naming.</div>
        <div style={{ ...baseCard, padding: '14px 16px', fontSize: 13, color: '#334155', fontWeight: 600 }}>✦ Pickup and delivery IDs are generated automatically once sender and schedule details are available.</div>
      </div>
    </div>
  );
}

const seg: React.CSSProperties = { flex: 1, border: 'none', borderRadius: 14, background: 'transparent', padding: '14px 18px', fontWeight: 800, color: '#475569', cursor: 'pointer' };
const segActive: React.CSSProperties = { ...seg, color: '#fff', boxShadow: '0 10px 24px rgba(15,118,110,.18)' };
const headRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 };
const hTitle: React.CSSProperties = { fontSize: 20, fontWeight: 900, color: '#0f172a' };
const hSub: React.CSSProperties = { color: '#64748b', fontSize: 13, marginTop: 3 };
const ghost: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: '10px 14px', cursor: 'pointer', fontWeight: 700, color: '#334155' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 };
const primary: React.CSSProperties = { border: 'none', borderRadius: 14, color: '#fff', padding: '12px 18px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 24px rgba(15,118,110,.16)' };
const secondary: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 14, background: '#fff', color: '#334155', padding: '12px 18px', fontWeight: 800, cursor: 'pointer' };
const pagerBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 12, border: '1px solid #dbe4ee', background: '#fff', cursor: 'pointer' };
