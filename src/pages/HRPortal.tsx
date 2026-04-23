import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { readApiJson } from "@/lib/readApiJson";
import { useT } from "@/hooks/useT";

type AuditRow = Record<string, any>;

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

function pretty(v: any) {
  if (v === null || v === undefined) return "-";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
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
  onClick,
  active = false,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <div
      style={{
        border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 14,
        background: active ? "#eff6ff" : "#f8fafc",
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

  if (!onClick) return body;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {body}
    </button>
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

function isHrLike(row: AuditRow) {
  const text = [
    row.action,
    row.resource_type,
    row.resource_id,
    row.target_status,
    row.actor_role,
    row.actor_name,
    row.actor_email,
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("hr") ||
    text.includes("employee") ||
    text.includes("approval") ||
    text.includes("leave") ||
    text.includes("payroll") ||
    text.includes("role") ||
    text.includes("permission") ||
    text.includes("admin")
  );
}

export default function HRPortal() {
  const { t: tr } = useT();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const activeSection = useMemo(() => {
    if (location.pathname.includes("/admin-hr/employees")) return "Employees";
    if (location.pathname.includes("/admin-hr/approvals")) return "Approvals";
    if (location.pathname.includes("/admin-hr/admin")) return "Admin Controls";
    if (location.pathname.includes("/admin-hr/reports")) return "Reports";
    return "Overview";
  }, [location.pathname]);

  async function loadPortal() {
    setLoading(true);
    setMessage("");

    const urls = [
      "/api/v1/audit/logs?limit=500",
      "/api/system/audit-logs?limit=500",
    ];

    let loaded: any = null;
    let lastError: any = null;

    for (const url of urls) {
      try {
        const res = await fetch(url);
        loaded = await readApiJson(res);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!loaded) {
      setMessage(normalizeError(lastError, "Failed to load HR portal"));
      setLogs([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    const allRows = Array.isArray(loaded?.data) ? loaded.data : [];
    const hrRows = allRows.filter(isHrLike);

    setLogs(hrRows);
    setSelected((prev) => {
      if (!hrRows.length) return null;
      if (!prev) return hrRows[0];
      return hrRows.find((x: AuditRow) => x.id === prev.id) || hrRows[0];
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadPortal();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((row) =>
      [
        row.actor_name,
        row.actor_email,
        row.actor_role,
        row.action,
        row.resource_type,
        row.resource_id,
        row.target_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, query]);

  const stats = useMemo(() => {
    const uniqueActors = new Set(
      logs
        .map((x) => x.actor_email || x.actor_name)
        .filter(Boolean)
    ).size;

    const approvals = logs.filter((x) =>
      String(x.action || "").toLowerCase().includes("approval")
    ).length;

    const roleChanges = logs.filter((x) => {
      const s = String(x.action || "").toLowerCase();
      return s.includes("role") || s.includes("permission");
    }).length;

    const employeeActions = logs.filter((x) => {
      const s = `${x.action || ""} ${x.resource_type || ""}`.toLowerCase();
      return s.includes("employee") || s.includes("leave") || s.includes("payroll");
    }).length;

    const resourceTypes = new Set(
      logs.map((x) => x.resource_type).filter(Boolean)
    ).size;

    const pendingLike = logs.filter((x) =>
      String(x.target_status || "").toLowerCase().includes("pending")
    ).length;

    return {
      totalLogs: logs.length,
      uniqueActors,
      approvals,
      roleChanges,
      employeeActions,
      resourceTypes,
      pendingLike,
    };
  }, [logs]);

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of logs) {
      const role = String(row.actor_role || "Unspecified").trim() || "Unspecified";
      counts.set(role, (counts.get(role) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([role, total]) => ({ role, total }));
  }, [logs]);

  const approvalWatchlist = useMemo(() => {
    const rows = logs.filter((x) => {
      const text = `${x.action || ""} ${x.target_status || ""} ${x.resource_type || ""}`.toLowerCase();
      return text.includes("approval") || text.includes("pending");
    });
    return rows.length ? rows.slice(0, 8) : logs.slice(0, 8);
  }, [logs]);

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
            {tr("Human Resources")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("HR Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Monitor HR-related audit activity, approvals, admin actions, and workforce governance from one secure portal.")}
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

      <section
        style={{
          ...card,
          display: "grid",
          gridTemplateColumns: "minmax(320px,1fr) auto auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
            {tr("HR Activity Search")}
          </div>
          <input
            style={inputStyle}
            placeholder={tr("Search actor, role, action, resource, or status")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button type="button" onClick={() => setQuery(query)} style={primaryBtn}>
          {tr("Filter")}
        </button>

        <div
          style={{
            borderRadius: 12,
            background: "#f8fafc",
            padding: "12px 16px",
            fontWeight: 800,
            color: "#334155",
          }}
        >
          {tr("Section")}: {activeSection}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<Users size={18} />} label={tr("HR/Admin Logs")} value={String(stats.totalLogs)} tone="info" />
        <KpiCard icon={<BadgeCheck size={18} />} label={tr("Approval Actions")} value={String(stats.approvals)} tone="good" />
        <KpiCard icon={<Shield size={18} />} label={tr("Role / Permission Changes")} value={String(stats.roleChanges)} tone="warn" />
        <KpiCard icon={<BriefcaseBusiness size={18} />} label={tr("Unique Actors")} value={String(stats.uniqueActors)} />
        <KpiCard icon={<ClipboardCheck size={18} />} label={tr("Employee Actions")} value={String(stats.employeeActions)} />
        <KpiCard icon={<FileText size={18} />} label={tr("Pending-Like Items")} value={String(stats.pendingLike)} tone="warn" />
        <KpiCard icon={<Shield size={18} />} label={tr("Resource Types")} value={String(stats.resourceTypes)} tone="info" />
        <KpiCard icon={<Users size={18} />} label={tr("Filtered Results")} value={String(filteredLogs.length)} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel
            title={tr("Recent HR / Admin Activity")}
            action={
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                {filteredLogs.length} row(s)
              </span>
            }
          >
            {filteredLogs.length ? (
              filteredLogs.slice(0, 12).map((row: AuditRow) => (
                <RowCard
                  key={safe(row.id)}
                  active={selected?.id === row.id}
                  onClick={() => setSelected(row)}
                  title={safe(row.action)}
                  badge={safe(row.target_status, "")}
                  line1={`${safe(row.actor_name)} · ${safe(row.actor_role)}`}
                  line2={`${safe(row.resource_type)} · ${safe(row.resource_id)} · ${safe(row.occurred_at)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading HR portal...") : tr("No HR activity records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Role Activity Summary")}>
            {roleSummary.length ? (
              roleSummary.map((row) => (
                <RowCard
                  key={row.role}
                  title={row.role}
                  line1={`${tr("Actions")}: ${row.total}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading HR portal...") : tr("No role activity summary available.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Selected Activity Detail")}>
            {selected ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <DetailMetric label={tr("Occurred At")} value={safe(selected.occurred_at)} />
                  <DetailMetric label={tr("Actor")} value={safe(selected.actor_name)} />
                  <DetailMetric label={tr("Actor Email")} value={safe(selected.actor_email)} />
                  <DetailMetric label={tr("Role")} value={safe(selected.actor_role)} />
                  <DetailMetric label={tr("Action")} value={safe(selected.action)} />
                  <DetailMetric label={tr("Resource Type")} value={safe(selected.resource_type)} />
                  <DetailMetric label={tr("Resource ID")} value={safe(selected.resource_id)} />
                  <DetailMetric label={tr("Target Status")} value={safe(selected.target_status)} />
                </div>

                <div
                  style={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      fontWeight: 800,
                      borderBottom: "1px solid #e2e8f0",
                      background: "#f8fafc",
                    }}
                  >
                    {tr("Payload")}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 14,
                      maxHeight: 240,
                      overflow: "auto",
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: "#334155",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {pretty(selected.payload)}
                  </pre>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <ActionLink to="/audit-logs" label={tr("Open Audit Logs")} />
                  <ActionLink to="/admin-hr/employees" label={tr("Employees")} />
                  <ActionLink to="/admin-hr/approvals" label={tr("Approvals")} />
                  <ActionLink to="/admin-hr/reports" label={tr("Reports")} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading HR portal...") : tr("Select an HR activity to view details.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Approval Watchlist")}>
            {approvalWatchlist.length ? (
              approvalWatchlist.map((row: AuditRow) => (
                <RowCard
                  key={`watch-${safe(row.id)}`}
                  title={safe(row.action)}
                  badge={safe(row.target_status, "")}
                  line1={`${safe(row.actor_name)} · ${safe(row.actor_role)}`}
                  line2={`${safe(row.resource_type)} · ${safe(row.occurred_at)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading HR portal...") : tr("No approval watchlist items found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Quick Actions")}>
            <ActionLink to="/admin-hr/employees" label={tr("Open Employees")} />
            <ActionLink to="/admin-hr/approvals" label={tr("Open Approvals")} />
            <ActionLink to="/admin-hr/admin" label={tr("Open Admin Controls")} />
            <ActionLink to="/admin-hr/reports" label={tr("Open Reports")} />
            <ActionLink to="/audit-logs" label={tr("Open Audit Logs")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}
