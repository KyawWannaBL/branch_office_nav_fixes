import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  DollarSign,
  Map,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { readApiJson } from "@/lib/readApiJson";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

type AnyRow = Record<string, any>;

const card: React.CSSProperties = {
  border: "1px solid #dbe4ee",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,.04)",
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
  if (/Unexpected token .* valid JSON/i.test(message)) {
    return "Server returned an invalid response";
  }
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
    <div
      style={{
        border: "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 14,
        background: "#f8fafc",
      }}
    >
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

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: "#0f172a", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

export default function BranchOfficePortal() {
  const { t: tr } = useT();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<any>(null);

  async function loadPortal() {
    setLoading(true);
    setMessage("");

    const results = await Promise.allSettled([
      safeGet("/api/v1/operations/command-center"),
      safeGet("/api/v1/riders/portal"),
      safeGet("/api/v1/deliveries/workflow"),
      safeGet("/api/v1/ways/dispatch-batches"),
      safeGet("/api/v1/delivery-exceptions?queue=failed"),
      safeGet("/api/v1/pickups?limit=250"),
      safeGet("/api/v1/master/tariffs"),
      safeGet("/api/v1/audit/logs?limit=200"),
    ]);

    const commandCenter = results[0].status === "fulfilled" ? results[0].value : null;
    const riderPortal = results[1].status === "fulfilled" ? results[1].value : null;
    const workflow = results[2].status === "fulfilled" ? results[2].value : null;
    const batches = results[3].status === "fulfilled" ? results[3].value : null;
    const exceptions = results[4].status === "fulfilled" ? results[4].value : null;
    const pickups = results[5].status === "fulfilled" ? results[5].value : null;
    const tariffs = results[6].status === "fulfilled" ? results[6].value : null;
    const audit = results[7].status === "fulfilled" ? results[7].value : null;

    if (results.every((r) => r.status === "rejected")) {
      const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setMessage(normalizeError(first?.reason, "Failed to load branch office portal"));
      setPayload(null);
      setLoading(false);
      return;
    }

    const rejectedCount = results.filter((r) => r.status === "rejected").length;
    if (rejectedCount > 0) {
      setMessage("Some branch office widgets could not be loaded, but the portal is available.");
    }

    setPayload({
      commandCenter: commandCenter?.data || null,
      riderPortal: riderPortal?.data || null,
      workflow: Array.isArray(workflow?.data) ? workflow.data : [],
      batches: Array.isArray(batches?.data) ? batches.data : [],
      exceptions: Array.isArray(exceptions?.data) ? exceptions.data : [],
      pickups: Array.isArray(pickups?.data)
        ? pickups.data
        : Array.isArray((pickups as any)?.pickups)
          ? (pickups as any).pickups
          : [],
      tariffs: Array.isArray(tariffs?.data) ? tariffs.data : [],
      audit: Array.isArray(audit?.data) ? audit.data : [],
      apiHealth: {
        commandCenter: results[0].status === "fulfilled",
        riderPortal: results[1].status === "fulfilled",
        workflow: results[2].status === "fulfilled",
        batches: results[3].status === "fulfilled",
        exceptions: results[4].status === "fulfilled",
        pickups: results[5].status === "fulfilled",
        tariffs: results[6].status === "fulfilled",
        audit: results[7].status === "fulfilled",
      },
    });

    setLoading(false);
  }

  useEffect(() => {
    void loadPortal();
  }, []);

  const stats = useMemo(() => {
    const workflowRows = payload?.workflow || [];
    const batchRows = payload?.batches || [];
    const exceptionRows = payload?.exceptions || [];
    const pickupRows = payload?.pickups || [];
    const tariffRows = payload?.tariffs || [];
    const auditRows = payload?.audit || [];
    const riderSummary = payload?.riderPortal?.driver_summary || [];

    const openWays = workflowRows.filter((x: AnyRow) => {
      const s = String(x.delivery_status || x.status || "").toUpperCase();
      return ["SAVED", "SUBMITTED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT"].includes(s);
    }).length;

    const delivered = workflowRows.filter((x: AnyRow) => String(x.delivery_status || x.status || "").toUpperCase() === "DELIVERED").length;
    const activeBatches = batchRows.filter((x: AnyRow) => String(x.status || "").toUpperCase() !== "CLOSED").length;
    const activeDrivers = riderSummary.length;
    const codOpen = workflowRows.reduce((sum: number, x: AnyRow) => sum + Number(x.waybill_total_cod || x.receivable || 0), 0);

    const today = new Date().toISOString().slice(0, 10);
    const pickupsToday = pickupRows.filter((x: AnyRow) =>
      String(x.pickup_date || x.created_at || "").slice(0, 10) === today
    ).length;

    const auditToday = auditRows.filter((x: AnyRow) =>
      String(x.occurred_at || "").slice(0, 10) === today
    ).length;

    return {
      openWays,
      delivered,
      activeBatches,
      activeDrivers,
      codOpen,
      exceptionCount: exceptionRows.length,
      pickupsToday,
      tariffCount: tariffRows.length,
      auditToday,
    };
  }, [payload]);

  const topBatches = useMemo(() => (payload?.batches || []).slice(0, 8), [payload]);
  const topExceptions = useMemo(() => (payload?.exceptions || []).slice(0, 8), [payload]);
  const riderSummary = useMemo(() => (payload?.riderPortal?.driver_summary || []).slice(0, 8), [payload]);
  const commandKpis = payload?.commandCenter?.kpis || {};

  const branchAuditFeed = useMemo(() => {
    const rows = payload?.audit || [];
    return rows
      .filter((x: AnyRow) => {
        const text = [
          x.action,
          x.resource_type,
          x.actor_role,
          x.actor_name,
          x.actor_email,
        ]
          .join(" ")
          .toLowerCase();

        return (
          text.includes("dispatch") ||
          text.includes("pickup") ||
          text.includes("delivery") ||
          text.includes("rider") ||
          text.includes("finance") ||
          text.includes("audit") ||
          text.includes("branch") ||
          text.includes("operations")
        );
      })
      .slice(0, 10);
  }, [payload]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section
        style={{
          ...card,
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
          background: "linear-gradient(135deg,#ffffff 0%,#f8fbff 50%,#eefcf7 100%)",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "#ecfeff",
              color: "#155e75",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".12em",
            }}
          >
            {tr("Branch Operations")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>
            {tr("Branch Office Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Integrated branch workspace that covers pickup intake, delivery execution, dispatch control, rider supervision, finance visibility, tariff readiness, and audit awareness from one portal.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPortal()}
          style={{
            ...secondaryBtn,
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
        <KpiCard icon={<Package size={18} />} label={tr("Open Ways")} value={String(stats.openWays)} tone="info" />
        <KpiCard icon={<Truck size={18} />} label={tr("Active Batches")} value={String(stats.activeBatches)} tone="good" />
        <KpiCard icon={<Users size={18} />} label={tr("Active Drivers")} value={String(stats.activeDrivers)} />
        <KpiCard icon={<DollarSign size={18} />} label={tr("COD Open")} value={`${money(stats.codOpen)} MMK`} tone="warn" />
        <KpiCard icon={<ClipboardList size={18} />} label={tr("Delivered")} value={String(stats.delivered)} tone="good" />
        <KpiCard icon={<ShieldCheck size={18} />} label={tr("Open Exceptions")} value={String(stats.exceptionCount)} tone="warn" />
        <KpiCard icon={<Warehouse size={18} />} label={tr("Pickups Today")} value={String(stats.pickupsToday)} />
        <KpiCard icon={<Map size={18} />} label={tr("Tariff Rows")} value={String(stats.tariffCount)} tone="info" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Branch Command Snapshot")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <DetailMetric label={tr("Active Dispatch Batches")} value={safe(commandKpis.active_dispatch_batches, "0")} />
              <DetailMetric label={tr("Closeout Pending")} value={safe(commandKpis.closeout_pending_batches, "0")} />
              <DetailMetric label={tr("Finance Exceptions")} value={safe(commandKpis.finance_exceptions_open, "0")} />
              <DetailMetric label={tr("Handovers Today")} value={safe(commandKpis.rider_handovers_today, "0")} />
              <DetailMetric label={tr("Audit Events Today")} value={String(stats.auditToday)} />
              <DetailMetric label={tr("Tariff Coverage")} value={String(stats.tariffCount)} />
            </div>
          </Panel>

          <Panel title={tr("Dispatch Control Feed")}>
            {topBatches.length ? (
              topBatches.map((row: AnyRow) => (
                <RowCard
                  key={safe(row.dispatch_batch_id)}
                  title={safe(row.dispatch_batch_id)}
                  badge={statusText("en", row.status)}
                  line1={`${safe(row.dispatch_date)} · ${safe(row.rider_name)} · ${safe(row.township)}`}
                  line2={`${tr("Hub")}: ${safe(row.hub_code)} · ${tr("Ways")}: ${safe(row.total_ways)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading branch office portal...") : tr("No dispatch batches found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Rider Supervision Summary")}>
            {riderSummary.length ? (
              riderSummary.map((row: AnyRow) => (
                <RowCard
                  key={safe(row.rider_name)}
                  title={safe(row.rider_name)}
                  line1={`${tr("Assigned")}: ${safe(row.assigned_ways)} · ${tr("OFD")}: ${safe(row.out_for_delivery)}`}
                  line2={`${tr("Failed")}: ${safe(row.failed_attempts)} · ${tr("COD Open")}: ${money(row.cod_open)} MMK`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading branch office portal...") : tr("No rider summary found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Exception Watchlist")}>
            {topExceptions.length ? (
              topExceptions.map((row: AnyRow) => (
                <RowCard
                  key={safe(row.delivery_id)}
                  title={safe(row.delivery_id)}
                  badge={statusText("en", row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township || row.township)}`}
                  line2={`${tr("Rider")}: ${safe(row.rider_name)} · ${tr("Pickup ID")}: ${safe(row.pickup_id)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading branch office portal...") : tr("No exception rows found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Branch Audit Feed")}>
            {branchAuditFeed.length ? (
              branchAuditFeed.map((row: AnyRow) => (
                <RowCard
                  key={safe(row.id)}
                  title={safe(row.action)}
                  badge={safe(row.target_status, "")}
                  line1={`${safe(row.actor_name)} · ${safe(row.actor_role)}`}
                  line2={`${safe(row.resource_type)} · ${safe(row.resource_id)} · ${safe(row.occurred_at)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading branch office portal...") : tr("No audit feed available.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Branch Quick Actions")}>
            <ActionLink to="/pickup-registration" label={tr("Open Pickup Registration")} />
            <ActionLink to="/delivery-registration" label={tr("Open Delivery Registration")} />
            <ActionLink to="/way-management" label={tr("Open Way Management")} />
            <ActionLink to="/delivery-workflow" label={tr("Open Delivery Workflow")} />
            <ActionLink to="/delivery-dispatch" label={tr("Open Delivery Dispatch")} />
            <ActionLink to="/delivery-exceptions" label={tr("Open Delivery Exceptions")} />
            <ActionLink to="/rider-portal" label={tr("Open Rider Portal")} />
            <ActionLink to="/finance-reconciliation" label={tr("Open Finance Reconciliation")} />
            <ActionLink to="/finance-export-pack" label={tr("Open Finance Export")} />
            <ActionLink to="/audit-logs" label={tr("Open Audit Logs")} />
            <ActionLink to="/master/tariffs" label={tr("Open Tariff Master")} />
            <ActionLink to="/operations-command-center" label={tr("Open Operations Command")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}
