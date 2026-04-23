// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

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

export default function FinanceReconciliationDashboard() {
  const { lang, t: tr } = useT();
  const [tab, setTab] = useState<"summary" | "rider" | "daily" | "aging">("summary");
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function loadData() {
    setMessage("");
    try {
      const qs = new URLSearchParams();
      qs.set("mode", tab);
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);

      const res = await fetch(`/api/v1/finance-reconciliation?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load finance reconciliation");
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load finance reconciliation");
    }
  }

  useEffect(() => {
    void loadData();
  }, [tab]);

  function exportCsv() {
    const qs = new URLSearchParams();
    qs.set("mode", tab);
    qs.set("format", "csv");
    if (dateFrom) qs.set("date_from", dateFrom);
    if (dateTo) qs.set("date_to", dateTo);
    window.open(`/api/v1/finance-reconciliation?${qs.toString()}`, "_blank");
  }

  const summary = rows[0] || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            Finance Reconciliation
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            Finance Reconciliation Dashboard
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            Settlement summaries, rider collections, daily COD trends, discrepancy aging, and exportable finance views.
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["summary", "Summary"],
            ["rider", "Rider Summary"],
            ["daily", "Daily Trend"],
            ["aging", "Discrepancy Aging"],
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
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, width: 170 }} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input style={{ ...inputStyle, width: 170 }} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button style={secondaryBtn} onClick={loadData}>Apply</button>
          <button style={primaryBtn} onClick={exportCsv}>Export CSV</button>
        </div>
      </section>

      {tab === "summary" && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 12 }}>
          <Metric label="Total Batches" value={safe(summary.total_batches || 0)} />
          <Metric label="Posted Batches" value={safe(summary.posted_batches || 0)} />
          <Metric label="Delivery Count" value={safe(summary.total_delivery_count || 0)} />
          <Metric label="Expected" value={money(summary.expected_amount)} />
          <Metric label="Collected" value={money(summary.collected_amount)} strong />
          <Metric label="Shortage" value={money(summary.shortage_amount)} />
          <Metric label="Overage" value={money(summary.overage_amount)} />
        </section>
      )}

      {tab !== "summary" && (
        <section style={card}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 16 }}>
            {tab === "rider" ? "Rider-wise Collection Summary" : tab === "daily" ? "Date-wise COD Trend" : "Discrepancy Aging"}
          </div>

          <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr>
                  {tab === "rider" && (
                    <>
                      <Th>Rider</Th>
                      <Th>Deliveries</Th>
                      <Th>Expected</Th>
                      <Th>Collected</Th>
                      <Th>Difference</Th>
                      <Th>Settled</Th>
                      <Th>Partial</Th>
                      <Th>Unsettled</Th>
                    </>
                  )}
                  {tab === "daily" && (
                    <>
                      <Th>Date</Th>
                      <Th>Batches</Th>
                      <Th>Deliveries</Th>
                      <Th>Expected</Th>
                      <Th>Collected</Th>
                      <Th>Shortage</Th>
                      <Th>Overage</Th>
                    </>
                  )}
                  {tab === "aging" && (
                    <>
                      <Th>Delivery ID</Th>
                      <Th>Pickup ID</Th>
                      <Th>Rider</Th>
                      <Th>Receiver</Th>
                      <Th>Delivered At</Th>
                      <Th>Expected</Th>
                      <Th>Collected</Th>
                      <Th>Status</Th>
                      <Th>Age Days</Th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, idx: number) => (
                  <tr key={idx}>
                    {tab === "rider" && (
                      <>
                        <Td strong>{safe(row.rider_name)}</Td>
                        <Td>{safe(row.delivery_count)}</Td>
                        <Td>{money(row.expected_amount)}</Td>
                        <Td>{money(row.collected_amount)}</Td>
                        <Td>{money(row.difference_amount)}</Td>
                        <Td>{safe(row.settled_count)}</Td>
                        <Td>{safe(row.partial_count)}</Td>
                        <Td>{safe(row.unsettled_count)}</Td>
                      </>
                    )}
                    {tab === "daily" && (
                      <>
                        <Td strong>{safe(row.settlement_date)}</Td>
                        <Td>{safe(row.total_batches)}</Td>
                        <Td>{safe(row.total_delivery_count)}</Td>
                        <Td>{money(row.expected_amount)}</Td>
                        <Td>{money(row.collected_amount)}</Td>
                        <Td>{money(row.shortage_amount)}</Td>
                        <Td>{money(row.overage_amount)}</Td>
                      </>
                    )}
                    {tab === "aging" && (
                      <>
                        <Td strong>{safe(row.delivery_id)}</Td>
                        <Td>{safe(row.pickup_id)}</Td>
                        <Td>{safe(row.rider_name)}</Td>
                        <Td>{safe(row.receiver_name)}</Td>
                        <Td>{safe(row.delivered_at)}</Td>
                        <Td>{money(row.expected_amount)}</Td>
                        <Td>{money(row.collected_amount)}</Td>
                        <Td>{safe(row.settlement_status)}</Td>
                        <Td>{safe(row.age_days)}</Td>
                      </>
                    )}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ ...card, padding: 14, background: strong ? "linear-gradient(135deg,#ecfeff 0%,#f0fdf4 100%)" : "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", textAlign: "left", padding: "14px 12px", borderBottom: "1px solid #e2e8f0" }}>{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td style={{ padding: "14px 12px", borderBottom: "1px solid #eef2f7", color: strong ? "#0f172a" : "#334155", fontWeight: strong ? 900 : 400, fontSize: 14 }}>{children}</td>;
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
