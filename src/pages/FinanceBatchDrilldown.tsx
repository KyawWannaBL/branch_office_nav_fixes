// @ts-nocheck
import React, { useState } from "react";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";
import { translateMessage } from "@/lib/translateMessage";

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

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

export default function FinanceBatchDrilldown() {
  const { lang, t: tr } = useT();

  const [dispatchBatchId, setDispatchBatchId] = useState("");
  const [payload, setPayload] = useState<any>(null);
  const [message, setMessage] = useState("");

  async function loadData() {
    setMessage("");
    setPayload(null);
    try {
      const res = await fetch(`/api/v1/finance/batch-drilldown?dispatch_batch_id=${encodeURIComponent(dispatchBatchId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setPayload(data.data);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  const batch = payload?.batch;
  const deliveries = payload?.deliveries || [];
  const scans = payload?.scan_events || [];
  const logs = payload?.way_logs || [];
  const scanSummary = payload?.scan_summary || {};
  const summary = payload?.delivery_summary || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            {tr("Finance Reconciliation")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Dispatch Batch Drill-Down")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Inspect one dispatch batch with deliveries, scan history, logs, and COD reconciliation summary.")}
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inputStyle, maxWidth: 320 }}
          placeholder={tr("Dispatch Batch ID")}
          value={dispatchBatchId}
          onChange={(e) => setDispatchBatchId(e.target.value)}
        />
        <button style={primaryBtn} onClick={loadData}>{tr("Apply")}</button>
      </section>

      {batch ? (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            <Metric label={tr("Dispatch Batch ID")} value={safe(batch.dispatch_batch_id)} strong />
            <Metric label={tr("Status")} value={statusText(lang, batch.status)} />
            <Metric label={tr("Rider")} value={safe(batch.rider_name)} />
            <Metric label={tr("Township")} value={safe(batch.township)} />
            <Metric label={tr("Selected deliveries")} value={safe(summary.total_ways)} />
            <Metric label={tr("Delivered")} value={safe(summary.delivered_count)} />
            <Metric label={tr("Failed Attempts")} value={safe(summary.failed_count)} />
            <Metric label={tr("Returned")} value={safe(summary.returned_count)} />
            <Metric label={tr("COD Expected")} value={money(batch.cod_expected)} />
            <Metric label={tr("COD Collected")} value={money(batch.cod_collected)} />
            <Metric label={tr("Shortage")} value={money(batch.shortage_amount)} />
            <Metric label={tr("Overage")} value={money(batch.overage_amount)} />
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
            <section style={card}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{tr("Delivery Rows")}</div>
              <div style={{ overflow: "auto", maxHeight: 460 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Delivery ID","Receiver Name","Township","Status","COD","Last Scan"].map((x) => (
                        <th key={x} style={th}>{tr(x)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((row: any) => (
                      <tr key={row.delivery_id}>
                        <td style={td}>{safe(row.delivery_id)}</td>
                        <td style={td}>{safe(row.receiver_name)}</td>
                        <td style={td}>{safe(row.receiver_township || row.township)}</td>
                        <td style={td}>{statusText(lang, row.delivery_status)}</td>
                        <td style={td}>{money(row.waybill_total_cod || row.receivable || 0)}</td>
                        <td style={td}>{safe(row.last_scan_type)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <section style={card}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{tr("Scan Summary")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.keys(scanSummary).length ? Object.entries(scanSummary).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, border: "1px solid #dbe4ee", borderRadius: 12, padding: 10 }}>
                      <span>{tr(k)}</span>
                      <strong>{safe(v)}</strong>
                    </div>
                  )) : <div style={{ color: "#64748b" }}>{tr("No records found for this queue.")}</div>}
                </div>
              </section>

              <section style={card}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{tr("Recent Logs")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflow: "auto" }}>
                  {logs.slice(0, 20).map((row: any) => (
                    <div key={row.id} style={{ border: "1px solid #dbe4ee", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{safe(row.action)}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{safe(row.created_at)}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                        {safe(row.delivery_id)} · {statusText(lang, row.from_status)} → {statusText(lang, row.to_status)}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{safe(row.note)}</div>
                    </div>
                  ))}
                  {!logs.length && <div style={{ color: "#64748b" }}>{tr("No audit logs.")}</div>}
                </div>
              </section>

              <section style={card}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{tr("Recent Scans")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflow: "auto" }}>
                  {scans.slice(0, 20).map((row: any) => (
                    <div key={row.id} style={{ border: "1px solid #dbe4ee", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{safe(row.scan_type)}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{safe(row.created_at)}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                        {safe(row.delivery_id)} · {safe(row.scan_code)}
                      </div>
                    </div>
                  ))}
                  {!scans.length && <div style={{ color: "#64748b" }}>{tr("No records found for this queue.")}</div>}
                </div>
              </section>
            </section>
          </section>
        </>
      ) : null}
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

const th: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #dbe4ee",
  fontWeight: 800,
  color: "#334155",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
};

const primaryBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#0f766e",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
