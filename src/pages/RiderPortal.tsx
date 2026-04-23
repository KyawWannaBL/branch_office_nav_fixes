import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Package,
  Printer,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
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
  checked = false,
  onToggle,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      style={{
        border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 14,
        background: active ? "#eff6ff" : "#f8fafc",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      {onToggle ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{ marginTop: 4 }}
        />
      ) : null}

      <button
        type="button"
        onClick={onClick}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: onClick ? "pointer" : "default",
          width: "100%",
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
      </button>
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

export default function RiderPortal() {
  const { lang, t: tr } = useT();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = useMemo(() => {
    if (location.pathname.endsWith("/helpers")) return "helpers";
    return "drivers";
  }, [location.pathname]);

  const [tab, setTab] = useState<"drivers" | "helpers">(initialTab);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<any>(null);
  const [selected, setSelected] = useState<AnyRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [helperName, setHelperName] = useState("");
  const [helperPhone, setHelperPhone] = useState("");
  const [note, setNote] = useState("");

  async function loadPortal(searchValue = query) {
    setLoading(true);
    setMessage("");

    try {
      const qs = new URLSearchParams();
      if (searchValue.trim()) qs.set("q", searchValue.trim());

      const res = await fetch(`/api/v1/riders/portal?${qs.toString()}`);
      const data = await readApiJson(res);

      setPayload(data.data || {});
      const queue = tab === "helpers"
        ? data.data?.helper_queue || []
        : [...(data.data?.unassigned || []), ...(data.data?.driver_queue || [])];

      setSelected((prev) => {
        if (!queue.length) return null;
        if (!prev) return queue[0];
        return queue.find((x: AnyRow) => x.delivery_id === prev.delivery_id) || queue[0];
      });
    } catch (error: any) {
      setPayload(null);
      setSelected(null);
      setMessage(normalizeError(error, "Failed to load rider portal"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPortal("");
  }, []);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const driverQueue = payload?.driver_queue || [];
  const helperQueue = payload?.helper_queue || [];
  const unassigned = payload?.unassigned || [];
  const activeBatches = payload?.active_batches || [];
  const driverSummary = payload?.driver_summary || [];
  const kpis = payload?.kpis || {};

  const queueRows = useMemo(() => {
    if (tab === "helpers") return helperQueue;
    return [...unassigned, ...driverQueue];
  }, [tab, helperQueue, unassigned, driverQueue]);

  function toggleId(deliveryId: string) {
    setSelectedIds((prev) =>
      prev.includes(deliveryId)
        ? prev.filter((x) => x !== deliveryId)
        : [...prev, deliveryId]
    );
  }

  function applyTab(next: "drivers" | "helpers") {
    setTab(next);
    navigate(next === "helpers" ? "/rider-portal/helpers" : "/rider-portal/drivers", { replace: true });
    setSelectedIds([]);
  }

  async function runAction(action: string) {
    setMessage("");

    try {
      const body: any = {
        action,
        note,
      };

      if (selectedBatchId) body.dispatch_batch_id = selectedBatchId;
      if (selectedIds.length) body.delivery_ids = selectedIds;
      if (driverName) body.rider_name = driverName;
      if (driverPhone) body.rider_phone = driverPhone;
      if (helperName) body.helper_name = helperName;
      if (helperPhone) body.helper_phone = helperPhone;

      const res = await fetch("/api/v1/riders/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await readApiJson(res);
      setMessage(`Action completed: ${data.updated} way(s) updated`);
      setSelectedIds([]);
      await loadPortal(query);
    } catch (error: any) {
      setMessage(normalizeError(error, "Failed to complete rider action"));
    }
  }

  function openBatchRouteSheet() {
    if (!selectedBatchId) {
      setMessage("Select an active dispatch batch first.");
      return;
    }

    const qs = new URLSearchParams();
    qs.set("dispatch_batch_id", selectedBatchId);
    qs.set("type", "ROUTE_SHEET");
    qs.set("format", "html");

    window.open(
      `/api/v1/ways/print-layout?${qs.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

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
            {tr("Rider Operations")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Rider Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Run driver and helper execution with go-live API wiring for assignment, staging, out-for-delivery, failed attempt, and delivered updates.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPortal(query)}
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
          gridTemplateColumns: "minmax(320px,1fr) auto auto auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
            {tr("Rider Queue Search")}
          </div>
          <input
            style={inputStyle}
            placeholder={tr("Search delivery ID, pickup ID, rider, township, phone, or batch")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button type="button" onClick={() => void loadPortal(query)} style={primaryBtn}>
          {tr("Apply")}
        </button>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            void loadPortal("");
          }}
          style={secondaryBtn}
        >
          {tr("Clear")}
        </button>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => applyTab("drivers")}
            style={{
              ...secondaryBtn,
              background: tab === "drivers" ? "#0f2f5c" : "#e2e8f0",
              color: tab === "drivers" ? "#fff" : "#334155",
            }}
          >
            {tr("Drivers")}
          </button>
          <button
            type="button"
            onClick={() => applyTab("helpers")}
            style={{
              ...secondaryBtn,
              background: tab === "helpers" ? "#0f2f5c" : "#e2e8f0",
              color: tab === "helpers" ? "#fff" : "#334155",
            }}
          >
            {tr("Helpers")}
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<Package size={18} />} label={tr("Open Ways")} value={String(kpis.total_open_ways || 0)} tone="info" />
        <KpiCard icon={<Users size={18} />} label={tr("Active Drivers")} value={String(kpis.active_drivers || 0)} />
        <KpiCard icon={<Truck size={18} />} label={tr("Out for Delivery")} value={String(kpis.out_for_delivery_ways || 0)} tone="good" />
        <KpiCard icon={<ShieldCheck size={18} />} label={tr("Active Batches")} value={String(kpis.active_batches || 0)} />
        <KpiCard icon={<ClipboardCheck size={18} />} label={tr("Unassigned Ways")} value={String(kpis.unassigned_ways || 0)} tone="warn" />
        <KpiCard icon={<Users size={18} />} label={tr("Helper Pending")} value={String(kpis.helper_pending_ways || 0)} tone="warn" />
        <KpiCard icon={<ClipboardCheck size={18} />} label={tr("Failed Attempts")} value={String(kpis.failed_attempts || 0)} tone="warn" />
        <KpiCard icon={<Package size={18} />} label={tr("COD Open")} value={`${money(kpis.cod_open || 0)} MMK`} tone="info" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel
            title={tab === "helpers" ? tr("Helper Queue") : tr("Driver Queue")}
            action={
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                {queueRows.length} row(s)
              </span>
            }
          >
            {queueRows.length ? (
              queueRows.slice(0, 20).map((row: AnyRow) => (
                <RowCard
                  key={row.delivery_id}
                  active={selected?.delivery_id === row.delivery_id}
                  checked={selectedIds.includes(row.delivery_id)}
                  onToggle={() => toggleId(row.delivery_id)}
                  onClick={() => setSelected(row)}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township || row.township)}`}
                  line2={`${safe(row.pickup_id)} · ${tr("Rider")}: ${safe(row.rider_name)} · ${tr("COD")}: ${money(row.waybill_total_cod || row.receivable || 0)} MMK`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading rider portal...") : tr("No rider queue rows found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Active Dispatch Batches")}>
            {activeBatches.length ? (
              activeBatches.slice(0, 12).map((row: AnyRow) => (
                <RowCard
                  key={row.dispatch_batch_id}
                  active={selectedBatchId === row.dispatch_batch_id}
                  onClick={() => setSelectedBatchId(row.dispatch_batch_id)}
                  title={safe(row.dispatch_batch_id)}
                  badge={statusText(lang, row.status)}
                  line1={`${safe(row.dispatch_date)} · ${safe(row.rider_name)} · ${safe(row.township)}`}
                  line2={`${tr("Hub")}: ${safe(row.hub_code)} · ${tr("Ways")}: ${safe(row.total_ways)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading rider portal...") : tr("No active batches found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tab === "helpers" ? tr("Helper Action Panel") : tr("Driver Action Panel")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <DetailMetric label={tr("Selected Ways")} value={String(selectedIds.length)} />
              <DetailMetric label={tr("Selected Batch")} value={safe(selectedBatchId)} />
              <DetailMetric label={tr("Delivery ID")} value={safe(selected?.delivery_id)} />
              <DetailMetric label={tr("Current Status")} value={statusText(lang, selected?.delivery_status)} />
              <DetailMetric label={tr("Receiver")} value={safe(selected?.receiver_name)} />
              <DetailMetric label={tr("Township")} value={safe(selected?.receiver_township || selected?.township)} />
            </div>

            {tab === "drivers" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    style={inputStyle}
                    placeholder={tr("Driver Name")}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    placeholder={tr("Driver Phone")}
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>

                <textarea
                  style={{ ...inputStyle, minHeight: 90 }}
                  placeholder={tr("Driver note")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" style={primaryBtn} onClick={() => void runAction("assign_driver")}>
                    {tr("Assign Driver")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("mark_ofd")}>
                    {tr("Mark Out for Delivery")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("mark_failed")}>
                    {tr("Mark Failed")}
                  </button>
                  <button type="button" style={primaryBtn} onClick={() => void runAction("mark_delivered")}>
                    {tr("Mark Delivered")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    style={inputStyle}
                    placeholder={tr("Helper Name")}
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    placeholder={tr("Helper Phone")}
                    value={helperPhone}
                    onChange={(e) => setHelperPhone(e.target.value)}
                  />
                </div>

                <textarea
                  style={{ ...inputStyle, minHeight: 90 }}
                  placeholder={tr("Helper note")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" style={primaryBtn} onClick={() => void runAction("helper_stage")}>
                    {tr("Helper Stage")}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...secondaryBtn,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onClick={openBatchRouteSheet}
                  >
                    <Printer size={16} />
                    {tr("Print Route Sheet")}
                  </button>
                </div>
              </>
            )}
          </Panel>

          <Panel title={tr("Driver Load Summary")}>
            {driverSummary.length ? (
              driverSummary.slice(0, 10).map((row: AnyRow) => (
                <RowCard
                  key={row.rider_name}
                  title={safe(row.rider_name)}
                  line1={`${tr("Assigned")}: ${safe(row.assigned_ways)} · ${tr("OFD")}: ${safe(row.out_for_delivery)}`}
                  line2={`${tr("Failed")}: ${safe(row.failed_attempts)} · ${tr("COD Open")}: ${money(row.cod_open)} MMK`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading rider portal...") : tr("No driver load summary found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Quick Actions")}>
            <ActionLink to="/delivery-workflow" label={tr("Open Delivery Workflow")} />
            <ActionLink to="/delivery-dispatch" label={tr("Open Delivery Dispatch")} />
            <ActionLink to="/delivery-exceptions" label={tr("Open Delivery Exceptions")} />
            <ActionLink to="/way-management" label={tr("Open Way Management")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}
