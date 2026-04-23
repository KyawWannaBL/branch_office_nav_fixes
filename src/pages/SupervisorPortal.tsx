import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardList, Map, Package, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { readApiJson } from "@/lib/readApiJson";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

type DeliveryRow = Record<string, any>;
type BatchRow = Record<string, any>;
type ExceptionRow = Record<string, any>;

const card: React.CSSProperties = {
  border: "1px solid #dbe4ee",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,.04)",
};

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

function normalizeError(error: any, fallback: string) {
  const message = String(error?.message || fallback);
  if (/Unexpected token .* valid JSON/i.test(message)) return "Server returned an invalid response";
  return message;
}

async function safeGet(url: string) {
  const res = await fetch(url);
  return readApiJson(res);
}

function KpiCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "info";
}) {
  const bg =
    tone === "good"
      ? "linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%)"
      : tone === "warn"
        ? "linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%)"
        : tone === "info"
          ? "linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%)"
          : "#fff";

  return (
    <div style={{ ...card, background: bg, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
          {label}
        </div>
        <div style={{ color: "#0f172a" }}>{icon}</div>
      </div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{title}</div>
        {action}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </section>
  );
}

function RowCard({
  title,
  line1,
  line2,
  badge,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
}) {
  return (
    <div style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 14, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: "#0f172a" }}>{title}</strong>
        {badge ? (
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#475569" }}>
            {badge}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 6, color: "#334155", fontSize: 13 }}>{line1}</div>
      {line2 ? <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{line2}</div> : null}
    </div>
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

export default function SupervisorPortal() {
  const { lang, t: tr } = useT();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [workflowRows, setWorkflowRows] = useState<DeliveryRow[]>([]);
  const [dispatchBatches, setDispatchBatches] = useState<BatchRow[]>([]);
  const [exceptionRows, setExceptionRows] = useState<ExceptionRow[]>([]);

  async function loadAll() {
    setLoading(true);
    setMessage("");

    const results = await Promise.allSettled([
      safeGet("/api/v1/deliveries/workflow"),
      safeGet("/api/v1/ways/dispatch-batches"),
      safeGet("/api/v1/delivery-exceptions?queue=failed"),
    ]);

    const wf = results[0].status === "fulfilled" ? results[0].value : null;
    const db = results[1].status === "fulfilled" ? results[1].value : null;
    const ex = results[2].status === "fulfilled" ? results[2].value : null;

    if (results.every((r) => r.status === "rejected")) {
      const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setMessage(normalizeError(first?.reason, "Failed to load supervisor portal"));
    } else {
      const rejectedCount = results.filter((r) => r.status === "rejected").length;
      if (rejectedCount > 0) {
        setMessage("Some supervisor widgets could not be loaded, but the portal is available.");
      }
    }

    setWorkflowRows(Array.isArray(wf?.data) ? wf.data : []);
    setDispatchBatches(Array.isArray(db?.data) ? db.data : []);
    setExceptionRows(Array.isArray(ex?.data) ? ex.data : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const stats = useMemo(() => {
    const rows = workflowRows || [];
    const batches = dispatchBatches || [];
    const exceptions = exceptionRows || [];

    const outForDelivery = rows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "OUT_FOR_DELIVERY").length;
    const delivered = rows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "DELIVERED").length;
    const failed = rows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "FAILED_ATTEMPT").length;
    const returned = rows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "RETURNED").length;
    const unassigned = rows.filter((x) => !String(x.rider_name || "").trim()).length;
    const activeBatches = batches.filter((x) => String(x.status || "").toUpperCase() !== "CLOSED").length;
    const codOpen = rows.reduce((sum, x) => sum + Number(x.waybill_total_cod || x.receivable || 0), 0);

    const townshipCounts = new Map<string, number>();
    for (const row of rows) {
      const township = String(row.receiver_township || row.township || "").trim();
      if (!township) continue;
      townshipCounts.set(township, (townshipCounts.get(township) || 0) + 1);
    }

    const topTownships = Array.from(townshipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([township, total]) => ({ township, total }));

    const riderCounts = new Map<string, number>();
    for (const row of rows) {
      const rider = String(row.rider_name || "").trim() || "Unassigned";
      riderCounts.set(rider, (riderCounts.get(rider) || 0) + 1);
    }

    const topRiders = Array.from(riderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rider, total]) => ({ rider, total }));

    return {
      totalWays: rows.length,
      outForDelivery,
      delivered,
      failed,
      returned,
      unassigned,
      activeBatches,
      openExceptions: exceptions.length,
      codOpen,
      topTownships,
      topRiders,
    };
  }, [workflowRows, dispatchBatches, exceptionRows]);

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
            {tr("Supervisor Control")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Supervisor Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Monitor live delivery execution, dispatch risk, team workload, and exception follow-up from one supervisor workspace.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAll()}
          style={{
            border: "none",
            borderRadius: 14,
            background: "#0f2f5c",
            color: "#fff",
            padding: "12px 16px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          {tr("Refresh")}
        </button>
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
          {message}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<Package size={18} />} label={tr("Total Ways")} value={String(stats.totalWays)} tone="info" />
        <KpiCard icon={<Truck size={18} />} label={tr("Out for Delivery")} value={String(stats.outForDelivery)} tone="good" />
        <KpiCard icon={<AlertTriangle size={18} />} label={tr("Open Exceptions")} value={String(stats.openExceptions)} tone="warn" />
        <KpiCard icon={<ShieldCheck size={18} />} label={tr("Active Dispatch Batches")} value={String(stats.activeBatches)} />
        <KpiCard icon={<ClipboardList size={18} />} label={tr("Delivered")} value={String(stats.delivered)} tone="good" />
        <KpiCard icon={<AlertTriangle size={18} />} label={tr("Failed Attempts")} value={String(stats.failed)} tone="warn" />
        <KpiCard icon={<Map size={18} />} label={tr("Unassigned Ways")} value={String(stats.unassigned)} tone="warn" />
        <KpiCard icon={<Package size={18} />} label={tr("Open COD Exposure")} value={`${money(stats.codOpen)} MMK`} tone="info" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Recent Dispatch Batches")}>
            {dispatchBatches.length ? (
              dispatchBatches.slice(0, 8).map((row: any) => (
                <RowCard
                  key={row.dispatch_batch_id}
                  title={safe(row.dispatch_batch_id)}
                  badge={statusText(lang, row.status)}
                  line1={`${safe(row.dispatch_date)} · ${safe(row.rider_name)} · ${safe(row.township)}`}
                  line2={`${tr("Ways")}: ${safe(row.total_ways)} · ${tr("Hub")}: ${safe(row.hub_code)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading supervisor portal...") : tr("No dispatch batches found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Exception Watchlist")}>
            {exceptionRows.length ? (
              exceptionRows.slice(0, 8).map((row: any) => (
                <RowCard
                  key={row.delivery_id}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township || row.township)}`}
                  line2={`${tr("Rider")}: ${safe(row.rider_name)} · ${tr("Pickup ID")}: ${safe(row.pickup_id)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading supervisor portal...") : tr("No exception rows found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Top Townships by Volume")}>
            {stats.topTownships.length ? (
              stats.topTownships.map((row) => (
                <div
                  key={row.township}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    border: "1px solid #dbe4ee",
                    borderRadius: 14,
                    padding: 12,
                    background: "#f8fafc",
                  }}
                >
                  <strong>{row.township}</strong>
                  <span>{row.total}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading supervisor portal...") : tr("No records found for this queue.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Top Rider Load")}>
            {stats.topRiders.length ? (
              stats.topRiders.map((row) => (
                <div
                  key={row.rider}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    border: "1px solid #dbe4ee",
                    borderRadius: 14,
                    padding: 12,
                    background: "#f8fafc",
                  }}
                >
                  <strong>{row.rider}</strong>
                  <span>{row.total}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading supervisor portal...") : tr("No records found for this queue.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Quick Actions")}>
            <ActionLink to="/delivery-workflow" label={tr("Open Delivery Workflow")} />
            <ActionLink to="/delivery-dispatch" label={tr("Open Delivery Dispatch")} />
            <ActionLink to="/delivery-exceptions" label={tr("Open Delivery Exceptions")} />
            <ActionLink to="/way-management" label={tr("Open Way Management")} />
            <ActionLink to="/pickup-control-center" label={tr("Open Pickup Control Center")} />
            <ActionLink to="/operations-command-center" label={tr("Open Operations Command")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}
