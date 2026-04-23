import { readApiJson } from "@/lib/readApiJson";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function normalizeError(error: any, fallback: string) {
  const message = String(error?.message || fallback);
  if (/Unexpected token .* valid JSON/i.test(message)) {
    return "Server returned an invalid response";
  }
  return message;
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        ...card,
        padding: 14,
        background: strong
          ? "linear-gradient(135deg,#ecfeff 0%,#f0fdf4 100%)"
          : "#fff",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </section>
  );
}

function RowCard({ title, line1, line2 }: { title: string; line1: string; line2: string }) {
  return (
    <div style={{ border: "1px solid #dbe4ee", borderRadius: 14, padding: 12, background: "#f8fafc" }}>
      <div style={{ fontWeight: 800, color: "#0f172a" }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>{line1}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{line2}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>{label}</div>;
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        borderRadius: 12,
        background: "#0f766e",
        color: "#fff",
        padding: "12px 16px",
        fontWeight: 800,
      }}
    >
      {label}
    </Link>
  );
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        border: "1px solid #dbe4ee",
        borderRadius: 14,
        padding: 12,
        color: "#0f172a",
        fontWeight: 700,
        background: "#fff",
      }}
    >
      {label}
    </Link>
  );
}

export default function OperationsCommandCenter() {
  const { lang, t: tr } = useT();
  const [payload, setPayload] = useState<any>(null);
  const [message, setMessage] = useState("");

  async function loadData() {
    setMessage("");

    const urls = [
      "/api/v1/operations/command-center",
      "/api/v1/command-center",
    ];

    let lastError: any = null;

    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await readApiJson(res);
        setPayload(data.data);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setMessage(normalizeError(lastError, "Failed to load"));
  }

  useEffect(() => {
    void loadData();
  }, []);

  const kpis = payload?.kpis || {};
  const summary = payload?.delivery_summary || {};
  const topTownships = payload?.top_townships || [];
  const recentBatches = payload?.recent_batches || [];
  const recentExceptions = payload?.recent_finance_exceptions || [];
  const recentReports = payload?.recent_handover_reports || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section
        style={{
          ...card,
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".12em",
            }}
          >
            {tr("Operations Command")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Operations Command Center")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Monitor dispatch, closeout, finance exceptions, rider handovers, and delivery movement from one executive workspace.")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QuickLink to="/way-management" label={tr("Way Management")} />
          <QuickLink to="/finance-exceptions" label={tr("Finance Exceptions")} />
          <QuickLink to="/rider-settlement-report" label={tr("Rider Settlement")} />
          <QuickLink to="/finance-export-pack" label={tr("Finance Export")} />
        </div>
      </section>

      {message ? (
        <div
          style={{
            border: "1px solid #a5f3fc",
            background: "#ecfeff",
            color: "#0f766e",
            padding: "12px 14px",
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <Metric label={tr("Active Dispatch Batches")} value={safe(kpis.active_dispatch_batches)} strong />
        <Metric label={tr("Closeout Pending")} value={safe(kpis.closeout_pending_batches)} />
        <Metric label={tr("Finance Exceptions")} value={safe(kpis.finance_exceptions_open)} />
        <Metric label={tr("Handovers Today")} value={safe(kpis.rider_handovers_today)} />
        <Metric label={tr("Total Ways")} value={safe(summary.total_ways)} />
        <Metric label={tr("Out for Delivery")} value={safe(summary.out_for_delivery)} />
        <Metric label={tr("Delivered")} value={safe(summary.delivered)} />
        <Metric label={tr("Failed Attempts")} value={safe(summary.failed_attempt)} />
        <Metric label={tr("Returned")} value={safe(summary.returned)} />
        <Metric label={tr("COD Total")} value={money(summary.cod_total)} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Recent Dispatch Batches")}>
            {recentBatches.length ? recentBatches.map((row: any) => (
              <RowCard
                key={row.dispatch_batch_id}
                title={safe(row.dispatch_batch_id)}
                line1={`${safe(row.dispatch_date)} · ${safe(row.rider_name)} · ${safe(row.township)}`}
                line2={`${tr("Status")}: ${statusText(lang, row.status)} · ${tr("Finance Status")}: ${statusText(lang, row.finance_exception_status || "OPEN")}`}
              />
            )) : <Empty label={tr("No records found for this queue.")} />}
          </Panel>

          <Panel title={tr("Recent Finance Exceptions")}>
            {recentExceptions.length ? recentExceptions.map((row: any) => (
              <RowCard
                key={row.dispatch_batch_id}
                title={safe(row.dispatch_batch_id)}
                line1={`${safe(row.rider_name)} · ${safe(row.dispatch_date)}`}
                line2={`${tr("Shortage")}: ${money(row.shortage_amount)} · ${tr("Overage")}: ${money(row.overage_amount)}`}
              />
            )) : <Empty label={tr("No records found for this queue.")} />}
          </Panel>

          <Panel title={tr("Recent Handover Reports")}>
            {recentReports.length ? recentReports.map((row: any) => (
              <RowCard
                key={row.report_id}
                title={safe(row.report_id)}
                line1={`${safe(row.report_date)} · ${safe(row.rider_name)}`}
                line2={`${tr("COD Expected")}: ${money(row.cod_expected)} · ${tr("COD Collected")}: ${money(row.cod_collected)}`}
              />
            )) : <Empty label={tr("No records found for this queue.")} />}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Top Townships")}>
            {topTownships.length ? topTownships.map((row: any) => (
              <div
                key={row.township}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  border: "1px solid #dbe4ee",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <strong>{safe(row.township)}</strong>
                <span>{safe(row.total_ways)}</span>
              </div>
            )) : <Empty label={tr("No records found for this queue.")} />}
          </Panel>

          <Panel title={tr("Quick Actions")}>
            <ActionLink to="/finance-batch-drilldown" label={tr("Batch Drill-Down")} />
            <ActionLink to="/delivery-workflow" label={tr("Delivery Workflow")} />
            <ActionLink to="/cod-settlements" label={tr("COD Settlements")} />
            <ActionLink to="/executive-operations" label={tr("Executive Operations")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}
