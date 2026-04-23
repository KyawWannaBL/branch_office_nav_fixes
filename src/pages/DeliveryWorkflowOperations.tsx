// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

const card: React.CSSProperties = {
  border: "1px solid #dbe4ee",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 14,
  fontFamily: "inherit",
};

export default function DeliveryWorkflowOperations() {
  const { lang, t: tr } = useT();
  const [tab, setTab] = useState<"assign" | "ofd" | "delivered" | "failed" | "returned" | "scan">("assign");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanBy, setScanBy] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [podNote, setPodNote] = useState("");
  const [failedReason, setFailedReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [podPhotoFile, setPodPhotoFile] = useState<File | null>(null);
  const [podSignatureFile, setPodSignatureFile] = useState<File | null>(null);

  const statusForTab =
    tab === "assign" ? "SUBMITTED" :
    tab === "ofd" ? "OUT_FOR_DELIVERY" :
    tab === "delivered" ? "DELIVERED" :
    tab === "failed" ? "FAILED_ATTEMPT" :
    tab === "returned" ? "RETURNED" : "";

  async function loadRows() {
    const qs = new URLSearchParams();
    if (statusForTab) qs.set("status", statusForTab);
    if (search) qs.set("q", search);

    const res = await fetch(`/api/v1/deliveries/workflow?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load delivery workflow");
    const list = Array.isArray(data?.data) ? data.data : [];
    setRows(list);
    if (list.length && !selected) setSelected(list[0]);
  }

  useEffect(() => {
    let active = true;
    setMessage("");
    (async () => {
      try {
        await loadRows();
      } catch (error: any) {
        if (!active) return;
        setMessage(error?.message || "Failed to load queue");
      }
    })();
    return () => {
      active = false;
    };
  }, [tab]);

  async function scanDelivery() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/deliveries/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_code: scanCode, scan_type: "SCREEN_SCAN", scanned_by: scanBy }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to scan delivery");

      setSelected(data.data);
      setReceiverName(data.data?.receiver_name || "");
      setReceiverPhone(data.data?.receiver_phone || "");
      setRiderName(data.data?.rider_name || "");
      setRiderPhone(data.data?.rider_phone || "");
      setMessage(`Scanned ${data.data.delivery_id}`);
    } catch (error: any) {
      setMessage(error?.message || "Failed to scan delivery");
    }
  }

  async function runAction(action: "assign_rider" | "out_for_delivery" | "delivered" | "failed_attempt" | "returned") {
    if (!selected?.delivery_id) return;
    setMessage("");

    try {
      const body: any = {
        action,
        delivery_id: selected.delivery_id,
        rider_name: riderName,
        rider_phone: riderPhone,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        pod_note: podNote,
        failed_reason: failedReason,
        return_reason: returnReason,
        delivered_by: riderName,
      };

      if (action === "delivered" && podPhotoFile) {
        body.pod_photo_base64 = await fileToBase64(podPhotoFile);
        body.pod_photo_type = podPhotoFile.type || "image/jpeg";
      }

      if (action === "delivered" && podSignatureFile) {
        body.pod_signature_base64 = await fileToBase64(podSignatureFile);
        body.pod_signature_type = podSignatureFile.type || "image/png";
      }

      const res = await fetch("/api/v1/deliveries/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update delivery workflow");

      setSelected(data.data);
      setMessage(`Action completed: ${action} for ${data.data.delivery_id}`);
      await loadRows();
    } catch (error: any) {
      setMessage(error?.message || "Failed to run workflow action");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            Delivery Workflow Operations
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            Rider Assignment, Scan, POD, and Status Workflow
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            Manage Out for Delivery, Delivered, Failed Attempt, Returned, POD capture, and scan-based operations.
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["assign", "Rider Assignment"],
          ["ofd", "Out for Delivery"],
          ["delivered", "Delivered"],
          ["failed", "Failed Attempt"],
          ["returned", "Returned"],
          ["scan", "Scan Screen"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            style={{
              border: "none",
              borderRadius: 14,
              padding: "12px 16px",
              fontWeight: 800,
              cursor: "pointer",
              background: tab === key ? "#0f2f5c" : "#f8fafc",
              color: tab === key ? "#fff" : "#475569",
            }}
          >
            {label}
          </button>
        ))}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px,.95fr) minmax(0,1.15fr)", gap: 18 }}>
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Queue</div>
            <input style={{ ...inputStyle, maxWidth: 240 }} placeholder={tr("Search delivery...")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 720, overflow: "auto" }}>
            {rows.map((row: any) => {
              const active = selected?.delivery_id === row.delivery_id;
              return (
                <button
                  key={row.delivery_id}
                  onClick={() => {
                    setSelected(row);
                    setReceiverName(row.receiver_name || "");
                    setReceiverPhone(row.receiver_phone || "");
                    setRiderName(row.rider_name || "");
                    setRiderPhone(row.rider_phone || "");
                  }}
                  style={{
                    textAlign: "left",
                    border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
                    borderRadius: 18,
                    background: active ? "#eff6ff" : "#fff",
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ color: "#0f172a" }}>{safe(row.delivery_id)}</strong>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                      {safe(row.delivery_status || row.status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: "#334155" }}>{safe(row.receiver_name)}</div>
                  <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                    {safe(row.receiver_township || row.township)} · Rider: {safe(row.rider_name)}
                  </div>
                </button>
              );
            })}
            {!rows.length && (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                No rows found for this queue.
              </div>
            )}
          </div>
        </section>

        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Workflow Action Panel</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 160px", gap: 12 }}>
            <input style={inputStyle} placeholder={tr("Scan / enter Delivery ID or QR value")} value={scanCode} onChange={(e) => setScanCode(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Scanned by")} value={scanBy} onChange={(e) => setScanBy(e.target.value)} />
            <button style={{ border: "none", borderRadius: 12, background: "#0f766e", color: "#fff", fontWeight: 800, cursor: "pointer" }} onClick={scanDelivery}>
              Scan Delivery
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <Metric label="Delivery ID" value={safe(selected?.delivery_id)} strong />
            <Metric label="Pickup ID" value={safe(selected?.pickup_id)} />
            <Metric label="Status" value={statusText(lang, selected?.delivery_status || selected?.status)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <input style={inputStyle} placeholder={tr("Rider Name")} value={riderName} onChange={(e) => setRiderName(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Rider Phone")} value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Receiver Name (POD)")} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Receiver Phone (POD)")} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Failed Reason")} value={failedReason} onChange={(e) => setFailedReason(e.target.value)} />
            <input style={inputStyle} placeholder={tr("Return Reason")} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
          </div>

          <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder={tr("POD note / delivery note")} value={podNote} onChange={(e) => setPodNote(e.target.value)} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ ...card, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>{tr("POD Photo")}</div>
              <input type="file" accept="image/*" onChange={(e) => setPodPhotoFile(e.target.files?.[0] || null)} />
            </label>
            <label style={{ ...card, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>{tr("POD Signature")}</div>
              <input type="file" accept="image/*" onChange={(e) => setPodSignatureFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={primaryBtn} onClick={() => runAction("assign_rider")}>{tr("Assign Rider")}</button>
            <button style={secondaryBtn} onClick={() => runAction("out_for_delivery")}>{tr("Mark Out for Delivery")}</button>
            <button style={primaryBtn} onClick={() => runAction("delivered")}>{tr("Mark Delivered")}</button>
            <button style={secondaryBtn} onClick={() => runAction("failed_attempt")}>{tr("Failed Attempt")}</button>
            <button style={secondaryBtn} onClick={() => runAction("returned")}>{tr("Returned")}</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ ...card, padding: 14, background: strong ? "linear-gradient(135deg,#ecfeff 0%,#f0fdf4 100%)" : "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#0f766e",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#0f2f5c",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
