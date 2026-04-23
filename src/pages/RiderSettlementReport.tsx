// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import { translateMessage } from "@/lib/translateMessage";
import { actorRequestHeaders, appendActorQuery } from "@/lib/actorIdentity";
import { useRoleAccess } from "@/hooks/useRoleAccess";

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

export default function RiderSettlementReport() {
  const { lang, t: tr } = useT();
  const access = useRoleAccess();

  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [riderName, setRiderName] = useState("");
  const [note, setNote] = useState("");
  const [savedReportId, setSavedReportId] = useState("");

  async function loadData() {
    setMessage("");
    try {
      const qs = new URLSearchParams();
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);
      if (riderName) qs.set("rider_name", riderName);

      const res = await fetch(`/api/v1/ways/rider-settlement?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      const list = Array.isArray(data?.data) ? data.data : [];
      setRows(list);
      if (list.length) setSelected(list[0]);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }


  function openPrintReport(reportId?: string) {
    const id = reportId || savedReportId;
    if (!id) {
      setMessage("No saved handover report yet.");
      return;
    }
    const qs = new URLSearchParams();
    qs.set("report_id", id);
    appendActorQuery(qs);
    window.open(`/api/v1/ways/rider-handover-print?${qs.toString()}`, "_blank", "noopener,noreferrer");
  }

  async function saveReport() {
    if (!selected) return;
    setMessage("");
    try {
      const reportDate = dateTo || new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/v1/ways/rider-settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...actorRequestHeaders() },
        body: JSON.stringify({
          report_date: reportDate,
          rider_name: selected.rider_name,
          rider_phone: selected.rider_phone,
          total_batches: selected.total_batches,
          delivered_count: selected.delivered_count,
          failed_count: selected.failed_count,
          returned_count: selected.returned_count,
          cod_expected: selected.cod_expected,
          cod_collected: selected.cod_collected,
          shortage_amount: selected.shortage_amount,
          overage_amount: selected.overage_amount,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setSavedReportId(data.data.report_id);
      setMessage(`Action completed: ${data.data.report_id}`);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            {tr("Rider Settlement")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Rider Settlement Handover Report")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Summarize closed dispatch batches by rider and save formal handover reports for finance reconciliation.")}
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...inputStyle, width: 170 }} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input style={{ ...inputStyle, width: 170 }} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <input style={{ ...inputStyle, width: 240 }} placeholder={tr("Rider Name")} value={riderName} onChange={(e) => setRiderName(e.target.value)} />
        <button style={secondaryBtn} onClick={loadData}>{tr("Apply")}</button>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px,1fr) minmax(0,1.1fr)", gap: 18 }}>
        <section style={card}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 16 }}>{tr("Rider Summary")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 680, overflow: "auto" }}>
            {rows.map((row: any) => (
              <button
                key={row.rider_name}
                onClick={() => setSelected(row)}
                style={{
                  border: selected?.rider_name === row.rider_name ? "1px solid #93c5fd" : "1px solid #dbe4ee",
                  borderRadius: 18,
                  background: selected?.rider_name === row.rider_name ? "#eff6ff" : "#fff",
                  padding: 14,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ color: "#0f172a" }}>{safe(row.rider_name)}</strong>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{row.total_batches} batch(es)</span>
                </div>
                <div style={{ marginTop: 6, color: "#334155", fontSize: 13 }}>
                  {tr("COD Expected")}: {money(row.cod_expected)} · {tr("COD Collected")}: {money(row.cod_collected)}
                </div>
                <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                  {tr("Delivered")}: {safe(row.delivered_count)} · {tr("Failed Attempts")}: {safe(row.failed_count)} · {tr("Returned")}: {safe(row.returned_count)}
                </div>
              </button>
            ))}
            {!rows.length && (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No records found for this queue.")}
              </div>
            )}
          </div>
        </section>

        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Settlement Detail")}</div>

          {selected ? (
            <>
              <Metric label={tr("Rider Name")} value={safe(selected.rider_name)} strong />
              <Metric label={tr("Rider Phone")} value={safe(selected.rider_phone)} />
              <Metric label={tr("Total Batches")} value={safe(selected.total_batches)} />
              <Metric label={tr("Delivered")} value={safe(selected.delivered_count)} />
              <Metric label={tr("Failed Attempts")} value={safe(selected.failed_count)} />
              <Metric label={tr("Returned")} value={safe(selected.returned_count)} />
              <Metric label={tr("COD Expected")} value={money(selected.cod_expected)} />
              <Metric label={tr("COD Collected")} value={money(selected.cod_collected)} />
              <Metric label={tr("Shortage")} value={money(selected.shortage_amount)} />
              <Metric label={tr("Overage")} value={money(selected.overage_amount)} />

              <textarea
                style={{ ...inputStyle, minHeight: 100 }}
                placeholder={tr("Notes / Remarks")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={{ ...primaryBtn, opacity: access.can("rider.handover.save") ? 1 : 0.55, cursor: access.can("rider.handover.save") ? "pointer" : "not-allowed" }} disabled={!access.can("rider.handover.save")} onClick={saveReport}>{tr("Save Handover Report")}</button>
                <button style={{ ...secondaryBtn, opacity: access.can("rider.handover.print") ? 1 : 0.55, cursor: access.can("rider.handover.print") ? "pointer" : "not-allowed" }} disabled={!access.can("rider.handover.print")} onClick={() => openPrintReport()}>{tr("Print Handover Report")}</button>
              </div>

              {savedReportId ? (
                <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                  {tr("Saved Report ID")}: {savedReportId}
                </div>
              ) : null}

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, background: "#f8fafc" }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{tr("Closed Batch List")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto" }}>
                  {(selected.batches || []).map((b: any) => (
                    <div key={b.dispatch_batch_id} style={{ fontSize: 13, color: "#334155" }}>
                      <strong>{safe(b.dispatch_batch_id)}</strong> · {safe(b.dispatch_date)} · {safe(b.township)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#64748b" }}>{tr("No records found for this queue.")}</div>
          )}
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
