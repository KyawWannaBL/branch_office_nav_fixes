import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FileImage,
  Package,
  QrCode,
  RefreshCw,
  Route,
  Save,
  ScanLine,
  Search,
  Truck,
  Upload,
  Warehouse,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

type SaveMode = "draft" | "submit";
type ToastTone = "ok" | "warn" | "err";

type IntakeForm = {
  serviceType: string;
  priority: string;
  requestedDate: string;

  senderName: string;
  senderPhone: string;
  pickupTownship: string;
  pickupAddress: string;

  recipientName: string;
  recipientPhone: string;
  deliveryTownship: string;
  deliveryAddress: string;

  itemName: string;
  parcelCount: string;
  quantity: string;
  weightKg: string;
  declaredValue: string;
  codAmount: string;
  paymentTerm: string;

  specialInstructions: string;
};

type CreateResult = {
  id: string;
  trackingNo: string;
  status: string;
  backend: boolean;
  message?: string;
};

const DEFAULT_FORM: IntakeForm = {
  serviceType: "Standard",
  priority: "Normal",
  requestedDate: new Date().toISOString().slice(0, 10),

  senderName: "",
  senderPhone: "",
  pickupTownship: "",
  pickupAddress: "",

  recipientName: "",
  recipientPhone: "",
  deliveryTownship: "",
  deliveryAddress: "",

  itemName: "",
  parcelCount: "1",
  quantity: "1",
  weightKg: "1",
  declaredValue: "0",
  codAmount: "0",
  paymentTerm: "Sender Pays",

  specialInstructions: "",
};

const DOWNTOWN_TOWNSHIPS = new Set([
  "latha",
  "lanmadaw",
  "pabedan",
  "kyauktada",
  "botahtaung",
  "pazundaung",
]);

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-700">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm text-slate-900 outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm text-slate-900 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function makeTrackingNo() {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `BEX-${stamp}${rand}`;
}

function readShadowShipments() {
  try {
    const raw = localStorage.getItem("britium-shadow-shipments");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeShadowShipment(payload: Record<string, unknown>) {
  const rows = readShadowShipments();
  rows.unshift(payload);
  localStorage.setItem("britium-shadow-shipments", JSON.stringify(rows.slice(0, 50)));
}

export default function CreateDelivery() {
  const navigate = useNavigate();

  const [form, setForm] = useState<IntakeForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scannerMode, setScannerMode] = useState<"camera" | "hardware">("camera");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [latest, setLatest] = useState<CreateResult | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totals = useMemo(() => {
    const parcelCount = Number(form.parcelCount || 0);
    const quantity = Number(form.quantity || 0);
    const weightKg = Number(form.weightKg || 0);
    const codAmount = Number(form.codAmount || 0);
    const declaredValue = Number(form.declaredValue || 0);

    return {
      parcelCount,
      quantity,
      weightKg,
      codAmount,
      declaredValue,
    };
  }, [form]);

  const routingHint = useMemo(() => {
    const township = form.deliveryTownship.trim().toLowerCase();
    const isDowntown = DOWNTOWN_TOWNSHIPS.has(township);
    const parcelCount = Number(form.parcelCount || 1);
    const weightKg = Number(form.weightKg || 0);

    if (isDowntown && weightKg <= 3 && parcelCount <= 2) {
      return {
        vehicle: "Bike / Urban Rider",
        nextScreen: "/production/delivery-execution",
        branch: "Inner-city last mile",
      };
    }

    if (weightKg > 10 || parcelCount > 5) {
      return {
        vehicle: "Van / Hub Dispatch",
        nextScreen: "/production/warehouse-execution",
        branch: "Hub staging required",
      };
    }

    return {
      vehicle: "Standard Delivery Van",
      nextScreen: "/production/pickup-execution",
      branch: "Regular delivery flow",
    };
  }, [form.deliveryTownship, form.parcelCount, form.weightKg]);

  function setField<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setScanInput("");
    setPhotoFile(null);
    setPhotoPreview("");
    setLatest(null);
  }

  async function persistShipment(status: "DRAFT" | "BOOKED"): Promise<CreateResult> {
    const trackingNo = makeTrackingNo();

    const payload = {
      tracking_no: trackingNo,
      awb_no: trackingNo,
      status,
      service_type: form.serviceType,
      priority: form.priority,
      requested_date: form.requestedDate,

      sender_name: form.senderName,
      sender_phone: form.senderPhone,
      pickup_township: form.pickupTownship,
      pickup_address: form.pickupAddress,

      recipient_name: form.recipientName,
      recipient_phone: form.recipientPhone,
      delivery_township: form.deliveryTownship,
      delivery_address: form.deliveryAddress,

      product_name: form.itemName,
      parcel_count: Number(form.parcelCount || 0),
      quantity: Number(form.quantity || 0),
      weight_kg: Number(form.weightKg || 0),
      declared_value_mmks: Number(form.declaredValue || 0),
      cod_amount_mmks: Number(form.codAmount || 0),
      payment_term: form.paymentTerm,
      internal_remark: form.specialInstructions || null,
      scan_reference: scanInput || null,
      created_at: new Date().toISOString(),
    };

    const insertResult = await supabase
      .from("shipments")
      .insert([payload])
      .select("id, tracking_no, awb_no, status")
      .maybeSingle();

    let photoUploaded = false;

    if (photoFile) {
      try {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `parcel-intake/${trackingNo}-${Date.now()}.${ext}`;
        const uploadResult = await supabase.storage
          .from("parcel-intake")
          .upload(path, photoFile, { upsert: true });
        photoUploaded = !uploadResult.error;
      } catch {
        photoUploaded = false;
      }
    }

    if (!insertResult.error && insertResult.data) {
      return {
        id: String(insertResult.data.id ?? trackingNo),
        trackingNo:
          String(insertResult.data.tracking_no ?? insertResult.data.awb_no ?? trackingNo),
        status: String(insertResult.data.status ?? status),
        backend: true,
        message: photoUploaded
          ? "Shipment saved with intake photo."
          : "Shipment saved to Supabase.",
      };
    }

    writeShadowShipment({
      id: trackingNo,
      trackingNo,
      status,
      backend: false,
      photoUploaded,
      payload,
      createdAt: new Date().toISOString(),
    });

    return {
      id: trackingNo,
      trackingNo,
      status,
      backend: false,
      message:
        insertResult.error?.message ||
        "Supabase insert failed. Saved to local fallback shadow queue.",
    };
  }

  async function handleSave(mode: SaveMode) {
    if (
      !form.senderName.trim() ||
      !form.senderPhone.trim() ||
      !form.recipientName.trim() ||
      !form.recipientPhone.trim() ||
      !form.pickupTownship.trim() ||
      !form.deliveryTownship.trim() ||
      !form.pickupAddress.trim() ||
      !form.deliveryAddress.trim() ||
      !form.itemName.trim()
    ) {
      setToast({
        tone: "err",
        message: "Complete the predefined shipment intake form first.",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await persistShipment(mode === "draft" ? "DRAFT" : "BOOKED");
      setLatest(result);

      if (result.backend) {
        setToast({
          tone: "ok",
          message:
            mode === "draft"
              ? `Draft ${result.trackingNo} saved to backend.`
              : `Shipment ${result.trackingNo} created and wired.`,
        });
      } else {
        setToast({
          tone: "warn",
          message:
            result.message ||
            "Backend mismatch detected. Saved locally so intake work does not stop.",
        });
      }
    } catch (error) {
      setToast({
        tone: "err",
        message: error instanceof Error ? error.message : "Unable to save shipment.",
      });
    } finally {
      setSaving(false);
    }
  }

  function onPhotoChange(file: File | null) {
    setPhotoFile(file);
    if (!file) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function refreshSession() {
    setRefreshing(true);
    try {
      await supabase.auth.getSession();
      setToast({ tone: "ok", message: "Supabase session refreshed." });
    } catch {
      setToast({ tone: "warn", message: "Session refresh skipped." });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="rounded-[36px] border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              Predefined Shipment Intake
            </div>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              Enterprise Delivery Creation
            </h1>
            <p className="mt-3 max-w-4xl text-sm text-slate-700">
              Start with the predefined data entry format, then continue into QR intake,
              parcel photo evidence, dispatch routing, warehouse execution, and live tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshSession}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 hover:bg-white"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Backend
          </button>
        </div>
      </div>

      {toast ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            toast.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : toast.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Predefined Data Entry Format"
          subtitle="This comes first before QR scan, OCR review, parcel intake photo, dispatch, and live tracking."
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave("draft")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 hover:bg-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => void handleSave("submit")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#123869] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Create & Route
              </button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Service Type"
              value={form.serviceType}
              onChange={(value) => setField("serviceType", value)}
              options={["Standard", "Same Day", "Express", "Office to Office"]}
            />
            <SelectField
              label="Priority"
              value={form.priority}
              onChange={(value) => setField("priority", value)}
              options={["Normal", "Urgent", "High Value"]}
            />
            <Field
              label="Requested Date"
              type="date"
              value={form.requestedDate}
              onChange={(value) => setField("requestedDate", value)}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white/45 p-5">
              <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                Sender / Pickup
              </div>
              <div className="grid gap-4">
                <Field
                  label="Sender Name"
                  value={form.senderName}
                  onChange={(value) => setField("senderName", value)}
                />
                <Field
                  label="Sender Phone"
                  value={form.senderPhone}
                  onChange={(value) => setField("senderPhone", value)}
                />
                <Field
                  label="Pickup Township"
                  value={form.pickupTownship}
                  onChange={(value) => setField("pickupTownship", value)}
                />
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                    Pickup Address
                  </label>
                  <textarea
                    value={form.pickupAddress}
                    onChange={(e) => setField("pickupAddress", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white/45 p-5">
              <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                Receiver / Delivery
              </div>
              <div className="grid gap-4">
                <Field
                  label="Recipient Name"
                  value={form.recipientName}
                  onChange={(value) => setField("recipientName", value)}
                />
                <Field
                  label="Recipient Phone"
                  value={form.recipientPhone}
                  onChange={(value) => setField("recipientPhone", value)}
                />
                <Field
                  label="Delivery Township"
                  value={form.deliveryTownship}
                  onChange={(value) => setField("deliveryTownship", value)}
                />
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                    Delivery Address
                  </label>
                  <textarea
                    value={form.deliveryAddress}
                    onChange={(e) => setField("deliveryAddress", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-black/10 bg-white/45 p-5">
            <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700">
              Parcel / Commercial Details
            </div>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <Field
                label="Item Name"
                value={form.itemName}
                onChange={(value) => setField("itemName", value)}
              />
              <Field
                label="Parcel Count"
                type="number"
                value={form.parcelCount}
                onChange={(value) => setField("parcelCount", value)}
              />
              <Field
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(value) => setField("quantity", value)}
              />
              <Field
                label="Weight (KG)"
                type="number"
                value={form.weightKg}
                onChange={(value) => setField("weightKg", value)}
              />
              <Field
                label="Declared Value"
                type="number"
                value={form.declaredValue}
                onChange={(value) => setField("declaredValue", value)}
              />
              <Field
                label="COD Amount"
                type="number"
                value={form.codAmount}
                onChange={(value) => setField("codAmount", value)}
              />
              <SelectField
                label="Payment Term"
                value={form.paymentTerm}
                onChange={(value) => setField("paymentTerm", value)}
                options={["Sender Pays", "Receiver Pays", "Merchant Wallet", "COD Deduct"]}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                Special Instructions
              </label>
              <textarea
                value={form.specialInstructions}
                onChange={(e) => setField("specialInstructions", e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Fragile, collect before noon, gate code, landmark, dispatch notes..."
              />
            </div>
          </div>
        </Panel>

        <Panel title="Backend & Screen Wiring" subtitle="This shipment is routed to the next operational screens and tries Supabase first.">
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-black/10 bg-white/70 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Routing Recommendation
              </div>
              <div className="mt-3 text-2xl font-black text-slate-950">{routingHint.vehicle}</div>
              <div className="mt-1 text-sm text-slate-700">{routingHint.branch}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Parcels
                </div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {totals.parcelCount || 0}
                </div>
              </div>
              <div className="rounded-[24px] border border-black/10 bg-white/70 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  COD
                </div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {Number(totals.codAmount || 0).toLocaleString()} Ks
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white/70 p-5">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Open Respective Screens
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/production/parcel-intake")}
                  className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Parcel Intake
                  <Warehouse className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(routingHint.nextScreen)}
                  className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Dispatch Execution
                  <Truck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/production/live-tracking")}
                  className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Live Tracking
                  <Route className="h-4 w-4" />
                </button>
              </div>
            </div>

            {latest ? (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Latest Shipment
                </div>
                <div className="mt-2 text-lg font-black text-emerald-900">
                  {latest.trackingNo}
                </div>
                <div className="mt-1 text-sm text-emerald-800">
                  Status: {latest.status} · Backend: {latest.backend ? "Supabase" : "Local Shadow Queue"}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="QR / Barcode Intake"
          subtitle="Scan first, or use manual fallback when camera or hardware scanner is not available."
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScannerMode("camera")}
                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
                  scannerMode === "camera"
                    ? "bg-[#0d2c54] text-white"
                    : "border border-black/10 bg-white/80 text-slate-800"
                }`}
              >
                <Camera className="mr-2 inline h-4 w-4" />
                Camera Scan
              </button>
              <button
                type="button"
                onClick={() => setScannerMode("hardware")}
                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
                  scannerMode === "hardware"
                    ? "bg-[#0d2c54] text-white"
                    : "border border-black/10 bg-white/80 text-slate-800"
                }`}
              >
                <ScanLine className="mr-2 inline h-4 w-4" />
                Hardware Mode
              </button>
            </div>
          }
        >
          <div className="rounded-[28px] border border-black/10 bg-white/70 p-5">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Manual Fallback
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <QrCode className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or type tracking / QR content"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-12 pr-4 text-sm text-slate-900 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!scanInput.trim()) {
                    setToast({ tone: "warn", message: "Enter scan content first." });
                    return;
                  }
                  setToast({ tone: "ok", message: `Captured scan: ${scanInput}` });
                }}
                className="rounded-2xl bg-[#0d2c54] px-5 py-3 text-xs font-black uppercase tracking-wider text-white"
              >
                Add
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Parcel Intake Photo" subtitle="Attach product / parcel photo evidence before intake submission.">
          <div className="rounded-[28px] border border-dashed border-black/15 bg-white/70 p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-6 py-10 text-center hover:bg-slate-50">
              <FileImage className="h-8 w-8 text-slate-500" />
              <div className="text-sm font-bold text-slate-800">
                Upload / Capture Image
              </div>
              <div className="text-xs text-slate-500">
                Product photo, parcel label, carton condition, or intake evidence
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
              />
            </label>

            {photoPreview ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white p-3">
                <img
                  src={photoPreview}
                  alt="Parcel preview"
                  className="max-h-[260px] w-full rounded-xl object-cover"
                />
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Workflow Timeline" subtitle="Use this order: form → scan → photo → intake → dispatch → tracking.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate("/production/parcel-intake")}
              className="rounded-[28px] border border-black/10 bg-white/70 p-5 text-left hover:bg-white"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <ScanLine className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">1</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-950">Scan parcel / label</div>
              <div className="mt-1 text-sm text-slate-700">Move into parcel intake screen</div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/production/ocr-workbench")}
              className="rounded-[28px] border border-black/10 bg-white/70 p-5 text-left hover:bg-white"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Search className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">2</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-950">Review intake data</div>
              <div className="mt-1 text-sm text-slate-700">OCR / manual validation stage</div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/production/warehouse-execution")}
              className="rounded-[28px] border border-black/10 bg-white/70 p-5 text-left hover:bg-white"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Warehouse className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">3</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-950">Route for dispatch</div>
              <div className="mt-1 text-sm text-slate-700">Warehouse staging and branch transfer</div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/production/live-tracking")}
              className="rounded-[28px] border border-black/10 bg-white/70 p-5 text-left hover:bg-white"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Truck className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">4</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-950">Monitor delivery</div>
              <div className="mt-1 text-sm text-slate-700">Continue in live tracking</div>
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
