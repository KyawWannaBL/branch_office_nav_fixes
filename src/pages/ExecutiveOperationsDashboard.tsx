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

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

function safe(v: any, fb = "0") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

export default function ExecutiveOperationsDashboard() {
  const { lang, t: tr } = useT();
  const [summary, setSummary] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/executive-overview");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load executive overview");
      setSummary(data.summary || {});
      setTrend(Array.isArray(data.trend) ? data.trend : []);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load executive overview");
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
            Executive Operations Dashboard
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            Company-wide Logistics and Finance Snapshot
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            View leadership KPIs for pickups, delivery execution, COD collections, settlements, and recent daily trend.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            border: "none",
            borderRadius: 12,
            background: "#0f2f5c",
            color: "#fff",
            padding: "12px 16px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 12 }}>
        <Metric label="Total Pickups" value={safe(summary.total_pickups)} />
        <Metric label="Draft Pickups" value={safe(summary.draft_pickups)} />
        <Metric label="Saved Pickups" value={safe(summary.saved_pickups)} />
        <Metric label="Submitted Pickups" value={safe(summary.submitted_pickups)} />
        <Metric label="Total Deliveries" value={safe(summary.total_deliveries)} />
        <Metric label="Out for Delivery" value={safe(summary.out_for_delivery)} />
        <Metric label="Delivered" value={safe(summary.delivered)} strong />
        <Metric label="Failed Attempts" value={safe(summary.failed_attempts)} />
        <Metric label="Returned" value={safe(summary.returned)} />
        <Metric label="COD Expected" value={money(summary.cod_expected)} />
        <Metric label="COD Collected" value={money(summary.cod_collected)} strong />
        <Metric label="Settlement Batches" value={safe(summary.settlement_batches)} />
        <Metric label="Posted Settlements" value={safe(summary.posted_settlements)} />
        <Metric label="Settlement Shortage" value={money(summary.settlement_shortage)} />
        <Metric label="Settlement Overage" value={money(summary.settlement_overage)} />
      </section>

      <section style={card}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 16 }}>
          Last 7 Days Trend
        </div>

        <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <Th>Day</Th>
                <Th>Pickups</Th>
                <Th>Delivered</Th>
                <Th>Failed Attempts</Th>
                <Th>Returned</Th>
                <Th>COD Collected</Th>
                <Th>Settlement Batches</Th>
              </tr>
            </thead>
            <tbody>
              {trend.map((row: any) => (
                <tr key={row.day}>
                  <Td strong>{row.day}</Td>
                  <Td>{safe(row.pickups)}</Td>
                  <Td>{safe(row.delivered)}</Td>
                  <Td>{safe(row.failed_attempts)}</Td>
                  <Td>{safe(row.returned)}</Td>
                  <Td>{money(row.cod_collected)}</Td>
                  <Td>{safe(row.settlement_batches)}</Td>
                </tr>
              ))}
              {!trend.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                    No trend data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
