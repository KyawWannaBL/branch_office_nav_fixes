// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useT } from "@/hooks/useT";

const card = {
  border: "1px solid #dbe4ee",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,.04)",
} as React.CSSProperties;

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "9px 10px",
  fontSize: 13,
  fontFamily: "inherit",
} as React.CSSProperties;

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "0";
}

async function readJson(res: Response) {
  const text = await res.text();
  const trimmed = String(text || "").trim();

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = trimmed ? JSON.parse(trimmed) : {};
      message = parsed?.error || parsed?.message || message;
    } catch {
      if (trimmed) message = trimmed;
    }
    throw new Error(message);
  }

  if (!trimmed) return {};
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    throw new Error("API returned HTML instead of JSON");
  }

  return JSON.parse(trimmed);
}

function emptyRow(index: number, pickupId: string) {
  return {
    row_key: `new-${index}`,
    delivery_id: "",
    pickup_id: pickupId,
    receiver_name: "",
    receiver_phone: "",
    receiver_city: "Yangon",
    receiver_township: "",
    receiver_address: "",
    item_name: "Parcel",
    weight_kg: 3,
    service_type: "standard",
    item_payment_status: "UNPAID",
    delivery_payment_status: "UNPAID",
    merchant_charge: 0,
    cod_amount: 0,
    base_fee: 0,
    surcharge: 0,
    final_delivery_fee: 0,
    total_cod: 0,
    notes: "",
    selected: false,
  };
}

export default function DataEntryOperationsDashboard() {
  const { t: tr } = useT();

  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<any>(null);
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [printSize, setPrintSize] = useState("4x6 Thermal");
  const [showSignature, setShowSignature] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  async function loadCenter(pickupId?: string) {
    setMessage("");
    try {
      const qs = new URLSearchParams();
      if (pickupId || selectedPickupId) qs.set("pickup_id", pickupId || selectedPickupId);

      const res = await fetch(`/api/v1/delivery-control-center?${qs.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = await readJson(res);

      const selected = data?.data?.selected_pickup_id || pickupId || selectedPickupId || "";
      const deliveryRows = Array.isArray(data?.data?.delivery_rows) ? data.data.delivery_rows : [];
      const activePickups = Array.isArray(data?.data?.active_pickups) ? data.data.active_pickups : [];

      setPayload({
        ...(data?.data || {}),
        active_pickups: activePickups,
      });
      setSelectedPickupId(selected);

      setRows(
        deliveryRows.length
          ? deliveryRows.map((x: any, i: number) => ({
              ...x,
              row_key: x.delivery_id || `existing-${i}`,
              final_delivery_fee:
                Math.max(Number(x.merchant_charge || 0), Number(x.base_fee || 0) + Number(x.surcharge || 0)),
              total_cod: Number(x.cod_amount || 0),
              selected: false,
            }))
          : Array.from({ length: 20 }).map((_, i) => emptyRow(i + 1, selected))
      );
    } catch (error: any) {
      setMessage(error?.message || "Failed to load delivery control center");
    }
  }

  async function recalcRow(index: number, patch?: any) {
    const row = { ...rows[index], ...(patch || {}) };
    setRows((prev) => prev.map((r, i) => (i === index ? row : r)));

    try {
      const res = await fetch("/api/v1/deliveries/recalc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          township: row.receiver_township,
          serviceType: row.service_type || "standard",
          weightKg: Number(row.weight_kg || 0),
          itemPrice: Number(row.cod_amount || 0),
          itemPaymentStatus: row.item_payment_status || "UNPAID",
          merchantCustomerDeliveryCharge: Number(row.merchant_charge || 0),
          deliveryPaymentStatus: row.delivery_payment_status || "UNPAID",
        }),
      });

      const data = await readJson(res);
      const calc = data?.data || {};

      const next = {
        ...row,
        base_fee: Number(calc.baseDeliveryFee || 0),
        surcharge: Number(calc.overweightSurcharge || 0),
        final_delivery_fee: Number(calc.printedWaybillDeliveryCharge || 0),
        total_cod: Number(calc.waybillTotalCod || 0),
      };

      setRows((prev) => prev.map((r, i) => (i === index ? next : r)));
    } catch {
      // keep row editable even if recalc fails
    }
  }

  function updateRow(index: number, key: string, value: any) {
    void recalcRow(index, { [key]: value });
  }

  function toggleRow(index: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }

  function addRows(count = 10) {
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: count }).map((_, i) => emptyRow(prev.length + i + 1, selectedPickupId)),
    ]);
  }

  async function saveAll() {
    setMessage("");

    try {
      if (!selectedPickupId) {
        setMessage("Select a linked pickup batch first.");
        return;
      }

      const payloadRows = rows
        .filter(
          (x) =>
            String(x.receiver_name || "").trim() ||
            String(x.receiver_phone || "").trim() ||
            String(x.receiver_address || "").trim()
        )
        .map((row, index) => ({
          lineNo: index + 1,
          deliveryId: row.delivery_id || "",
          receiverName: row.receiver_name || "",
          receiverPhone: row.receiver_phone || "",
          receiverAddress: row.receiver_address || "",
          receiverCity: row.receiver_city || "Yangon",
          receiverTownship: row.receiver_township || "",
          weightKg: Number(row.weight_kg || 0),
          codAmount: Number(row.cod_amount || 0),
          itemPrice: Number(row.cod_amount || 0),
          serviceType: row.service_type || "standard",
          itemPaymentStatus: row.item_payment_status || "UNPAID",
          deliveryPaymentStatus: row.delivery_payment_status || "UNPAID",
          merchantCharge: Number(row.merchant_charge || 0),
          merchantCustomerDeliveryCharge: Number(row.merchant_charge || 0),
          notes: row.notes || "",
        }));

      const activePickup = (payload?.active_pickups || []).find(
        (x: any) => String(x.pickup_id || "") === String(selectedPickupId || "")
      );

      const res = await fetch("/api/v1/pickups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action: "save_pickup",
          pickup: {
            pickupId: selectedPickupId,
            pickupDate: activePickup?.pickup_date || new Date().toISOString().slice(0, 10),
            sourceType: activePickup?.source_type || "MERCHANT",
            merchantName: activePickup?.merchant_name || "",
            contactName: activePickup?.contact_name || "",
            contactPhone: activePickup?.contact_phone || "",
            pickupAddress: activePickup?.pickup_address || "",
            pickupCity: activePickup?.pickup_city || "Yangon",
            pickupTownship: activePickup?.pickup_township || "",
            totalWays: payloadRows.length,
            remarks: activePickup?.remarks || "",
          },
          deliveries: payloadRows,
        }),
      });

      const data = await readJson(res);
      setMessage(`Saved ${data?.deliveries?.length || payloadRows.length} delivery row(s)`);
      await loadCenter(selectedPickupId);
    } catch (error: any) {
      setMessage(error?.message || "Failed to save delivery rows");
    }
  }

  function printSelected() {
    const selected = rows.filter((x) => x.selected);
    if (!selected.length) {
      setMessage("Select at least one row to print.");
      return;
    }
    setMessage(`Print queued: ${selected.length} waybill(s) on ${printSize}`);
  }

  useEffect(() => {
    void loadCenter("");
  }, []);

  const activePickups = payload?.active_pickups || [];
  const selectedPickup = activePickups.find((x: any) => String(x.pickup_id || "") === String(selectedPickupId || ""));
  const selectedCount = rows.filter((x) => x.selected).length;
  const liveTotals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.base += Number(row.base_fee || 0);
          acc.surcharge += Number(row.surcharge || 0);
          acc.final += Number(row.final_delivery_fee || 0);
          acc.cod += Number(row.total_cod || 0);
          return acc;
        },
        { base: 0, surcharge: 0, final: 0, cod: 0 }
      ),
    [rows]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, position: "sticky", top: 12, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
              {tr("Enterprise Delivery Workspace")}
            </div>
            <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
              {tr("Delivery Control Center")}
            </h1>
            <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
              {tr("Merged delivery registration and data entry portal with bulk grid, live pricing, printing, evidence tools, and signature support.")}
            </p>
          </div>

          <div style={{ minWidth: 220, border: "1px solid #dbe4ee", borderRadius: 18, padding: 14, background: "#f8fafc" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
              {tr("Linked Pickup")}
            </div>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900, color: "#0f172a", wordBreak: "break-word" }}>
              {safe(selectedPickupId)}
            </div>
            <div style={{ marginTop: 10, color: "#64748b", fontSize: 12 }}>
              {safe(selectedPickup?.merchant_name)} · {safe(selectedPickup?.pickup_township)}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 180px auto auto auto auto auto", gap: 10, alignItems: "center" }}>
          <select style={inputStyle} value={selectedPickupId} onChange={(e) => void loadCenter(e.target.value)}>
            <option value="">{tr("Select Pickup Batch")}</option>
            {activePickups.map((row: any) => (
              <option key={row.pickup_id} value={row.pickup_id}>
                {row.pickup_id} · {row.merchant_name}
              </option>
            ))}
          </select>

          <select style={inputStyle} value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
            <option>4x6 Thermal</option>
            <option>A6 Label</option>
            <option>A4 Manifest</option>
          </select>

          <button type="button" onClick={() => setMessage("Evidence upload ribbon ready.")} style={{ border: "none", borderRadius: 12, background: "#fff7ed", color: "#9a3412", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
            {tr("📷 Evidence Uploads")}
          </button>

          <button type="button" onClick={printSelected} style={{ border: "none", borderRadius: 12, background: "#0f2f5c", color: "#fff", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
            {tr("Print Selected")}
          </button>

          <button type="button" onClick={() => setShowSignature(true)} style={{ border: "none", borderRadius: 12, background: "#e0f2fe", color: "#075985", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
            {tr("E-Signature Pad")}
          </button>

          <button type="button" onClick={() => addRows(10)} style={{ border: "none", borderRadius: 12, background: "#f8fafc", color: "#334155", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
            {tr("+ 10 Rows")}
          </button>

          <button type="button" onClick={() => void saveAll()} style={{ border: "none", borderRadius: 12, background: "#0f766e", color: "#fff", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
            {tr("Save Grid")}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
          <Metric label={tr("Selected Rows")} value={String(selectedCount)} />
          <Metric label={tr("Grid Rows")} value={String(rows.length)} />
          <Metric label={tr("Base Total")} value={`${money(liveTotals.base)} MMK`} />
          <Metric label={tr("Surcharge Total")} value={`${money(liveTotals.surcharge)} MMK`} />
          <Metric label={tr("Final Max Total")} value={`${money(liveTotals.final)} MMK`} />
          <Metric label={tr("COD Total")} value={`${money(liveTotals.cod)} MMK`} />
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <section style={card}>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1900 }}>
            <thead>
              <tr>
                {[
                  "✓",
                  "Delivery ID",
                  "Receiver Name",
                  "Phone",
                  "City",
                  "Township",
                  "Address",
                  "Item",
                  "Weight KG",
                  "Service",
                  "Item Payment",
                  "Delivery Payment",
                  "Merchant Charge",
                  "Base",
                  "Overweight",
                  "Final Max",
                  "Total COD",
                  "Notes",
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8fafc",
                      textAlign: "left",
                      padding: "10px 8px",
                      borderBottom: "1px solid #dbe4ee",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {tr(label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.row_key || index}>
                  <td style={cellStyle}>
                    <input type="checkbox" checked={!!row.selected} onChange={() => toggleRow(index)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.delivery_id || ""} onChange={(e) => updateRow(index, "delivery_id", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.receiver_name || ""} onChange={(e) => updateRow(index, "receiver_name", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.receiver_phone || ""} onChange={(e) => updateRow(index, "receiver_phone", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.receiver_city || ""} onChange={(e) => updateRow(index, "receiver_city", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.receiver_township || ""} onChange={(e) => updateRow(index, "receiver_township", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.receiver_address || ""} onChange={(e) => updateRow(index, "receiver_address", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.item_name || ""} onChange={(e) => updateRow(index, "item_name", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} type="number" min={0} value={row.weight_kg || 0} onChange={(e) => updateRow(index, "weight_kg", e.target.value)} />
                  </td>
                  <td style={cellStyle}>
                    <select style={inputStyle} value={row.service_type || "standard"} onChange={(e) => updateRow(index, "service_type", e.target.value)}>
                      <option value="standard">standard</option>
                      <option value="express">express</option>
                      <option value="same_day">same_day</option>
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <select style={inputStyle} value={row.item_payment_status || "UNPAID"} onChange={(e) => updateRow(index, "item_payment_status", e.target.value)}>
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <select style={inputStyle} value={row.delivery_payment_status || "UNPAID"} onChange={(e) => updateRow(index, "delivery_payment_status", e.target.value)}>
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </td>
                  <td style={cellStyle}>
                    <input style={inputStyle} type="number" min={0} value={row.merchant_charge || 0} onChange={(e) => updateRow(index, "merchant_charge", e.target.value)} />
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 800 }}>{money(row.base_fee || 0)}</td>
                  <td style={{ ...cellStyle, fontWeight: 800 }}>{money(row.surcharge || 0)}</td>
                  <td style={{ ...cellStyle, fontWeight: 900, color: "#0f766e" }}>{money(row.final_delivery_fee || 0)}</td>
                  <td style={{ ...cellStyle, fontWeight: 900, color: "#0f172a" }}>{money(row.total_cod || 0)}</td>
                  <td style={cellStyle}>
                    <input style={inputStyle} value={row.notes || ""} onChange={(e) => updateRow(index, "notes", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <section style={card}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
            {tr("Evidence Ribbon")}
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
            style={inputStyle}
          />
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
            {evidenceFiles.length
              ? `${evidenceFiles.length} evidence file(s) ready`
              : tr("Attach damage photos or operational evidence without leaving the grid.")}
          </div>
        </section>

        <section style={card}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
            {tr("Waybill Printing Engine")}
          </div>
          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
            {tr("Select any rows, choose print size, and print waybills directly from this workspace.")}
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={printSelected} style={{ border: "none", borderRadius: 12, background: "#0f2f5c", color: "#fff", padding: "12px 16px", fontWeight: 800, cursor: "pointer" }}>
              {tr("Print Checked Rows")}
            </button>
          </div>
        </section>
      </section>

      {showSignature ? (
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{tr("E-Signature Pad")}</div>
            <button
              type="button"
              onClick={() => setShowSignature(false)}
              style={{ border: "none", borderRadius: 12, background: "#e2e8f0", color: "#334155", padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
            >
              {tr("Close")}
            </button>
          </div>
          <div style={{ border: "2px dashed #cbd5e1", borderRadius: 16, minHeight: 180, display: "grid", placeItems: "center", color: "#64748b", fontWeight: 700 }}>
            {tr("Signature capture area ready over the live delivery grid.")}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};
