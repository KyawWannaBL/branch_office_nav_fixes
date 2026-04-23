import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
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

export default function CustomerPortal() {
  const { lang, t: tr } = useT();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [lookupRows, setLookupRows] = useState<AnyRow[]>([]);
  const [failedRows, setFailedRows] = useState<AnyRow[]>([]);
  const [returnedRows, setReturnedRows] = useState<AnyRow[]>([]);
  const [selected, setSelected] = useState<AnyRow | null>(null);

  async function loadPortal(searchValue = query) {
    setLoading(true);
    setMessage("");

    const deliveryQs = new URLSearchParams();
    if (searchValue.trim()) deliveryQs.set("q", searchValue.trim());

    const results = await Promise.allSettled([
      safeGet(`/api/v1/deliveries/workflow?${deliveryQs.toString()}`),
      safeGet("/api/v1/delivery-exceptions?queue=failed"),
      safeGet("/api/v1/delivery-exceptions?queue=returned"),
    ]);

    const deliveries = results[0].status === "fulfilled" ? results[0].value : null;
    const failed = results[1].status === "fulfilled" ? results[1].value : null;
    const returned = results[2].status === "fulfilled" ? results[2].value : null;

    if (results.every((r) => r.status === "rejected")) {
      const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setMessage(normalizeError(first?.reason, "Failed to load customer portal"));
    } else {
      const rejectedCount = results.filter((r) => r.status === "rejected").length;
      if (rejectedCount > 0) {
        setMessage("Some customer widgets could not be loaded, but the portal is available.");
      }
    }

    const deliveryList = Array.isArray(deliveries?.data) ? deliveries.data : [];
    const failedList = Array.isArray(failed?.data) ? failed.data : [];
    const returnedList = Array.isArray(returned?.data) ? returned.data : [];

    setLookupRows(deliveryList);
    setFailedRows(failedList);
    setReturnedRows(returnedList);

    setSelected((prev) => {
      if (!deliveryList.length) return null;
      if (!prev) return deliveryList[0];
      return deliveryList.find((x: AnyRow) => x.delivery_id === prev.delivery_id) || deliveryList[0];
    });

    setLoading(false);
  }

  useEffect(() => {
    void loadPortal("");
  }, []);

  const stats = useMemo(() => {
    const delivered = lookupRows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "DELIVERED").length;
    const outForDelivery = lookupRows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "OUT_FOR_DELIVERY").length;
    const inTransit = lookupRows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "IN_TRANSIT").length;

    return {
      trackingResults: lookupRows.length,
      delivered,
      outForDelivery,
      inTransit,
      failedQueue: failedRows.length,
      returnedQueue: returnedRows.length,
      openSupportQueues: failedRows.length + returnedRows.length,
    };
  }, [lookupRows, failedRows, returnedRows]);

  const topTownships = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of lookupRows) {
      const township = String(row.receiver_township || row.township || "").trim();
      if (!township) continue;
      counts.set(township, (counts.get(township) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([township, total]) => ({ township, total }));
  }, [lookupRows]);

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
            {tr("Customer")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Customer Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Track shipment progress, review delivery status, and check exception queues from one customer-facing workspace.")}
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
            {tr("Shipment Tracking Search")}
          </div>
          <input
            style={inputStyle}
            placeholder={tr("Search by Delivery ID, Pickup ID, Receiver, Phone, or Township")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => void loadPortal(query)}
          style={{
            ...primaryBtn,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search size={16} />
          {tr("Search")}
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
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<PackageSearch size={18} />} label={tr("Tracking Results")} value={String(stats.trackingResults)} tone="info" />
        <KpiCard icon={<ShieldCheck size={18} />} label={tr("Delivered")} value={String(stats.delivered)} tone="good" />
        <KpiCard icon={<ClipboardList size={18} />} label={tr("Out for Delivery")} value={String(stats.outForDelivery)} />
        <KpiCard icon={<AlertTriangle size={18} />} label={tr("Open Exception Queues")} value={String(stats.openSupportQueues)} tone="warn" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel
            title={tr("Shipment Tracking Results")}
            action={
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                {lookupRows.length} result(s)
              </span>
            }
          >
            {lookupRows.length ? (
              lookupRows.slice(0, 12).map((row: AnyRow) => (
                <RowCard
                  key={row.delivery_id}
                  active={selected?.delivery_id === row.delivery_id}
                  onClick={() => setSelected(row)}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status || row.status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_phone)}`}
                  line2={`${safe(row.pickup_id)} · ${safe(row.receiver_township || row.township)} · ${tr("Rider")}: ${safe(row.rider_name)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading customer portal...") : tr("No shipment records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Top Tracking Townships")}>
            {topTownships.length ? (
              topTownships.map((row) => (
                <RowCard
                  key={row.township}
                  title={row.township}
                  line1={`${tr("Ways")}: ${row.total}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading customer portal...") : tr("No township activity found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Selected Shipment Detail")}>
            {selected ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <DetailMetric label={tr("Delivery ID")} value={safe(selected.delivery_id)} />
                  <DetailMetric label={tr("Pickup ID")} value={safe(selected.pickup_id)} />
                  <DetailMetric label={tr("Status")} value={statusText(lang, selected.delivery_status || selected.status)} />
                  <DetailMetric label={tr("Receiver")} value={safe(selected.receiver_name)} />
                  <DetailMetric label={tr("Receiver Phone")} value={safe(selected.receiver_phone)} />
                  <DetailMetric label={tr("Township")} value={safe(selected.receiver_township || selected.township)} />
                  <DetailMetric label={tr("Address")} value={safe(selected.receiver_address || selected.delivery_address)} />
                  <DetailMetric label={tr("Rider")} value={safe(selected.rider_name)} />
                  <DetailMetric label={tr("Rider Phone")} value={safe(selected.rider_phone)} />
                  <DetailMetric label={tr("Receivable")} value={`${money(selected.waybill_total_cod || selected.receivable || 0)} MMK`} />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <ActionLink to="/customer-service" label={tr("Open Customer Service")} />
                  <ActionLink to="/audit-logs" label={tr("Open Audit Logs")} />
                  <ActionLink to="/dashboard" label={tr("Open Dashboard")} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading customer portal...") : tr("Select a shipment to view details.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Failed Attempt Queue")}>
            {failedRows.length ? (
              failedRows.slice(0, 6).map((row: AnyRow) => (
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
                {loading ? tr("Loading customer portal...") : tr("No failed-attempt records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Returned Queue")}>
            {returnedRows.length ? (
              returnedRows.slice(0, 6).map((row: AnyRow) => (
                <RowCard
                  key={row.delivery_id}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township || row.township)}`}
                  line2={`${tr("Pickup ID")}: ${safe(row.pickup_id)} · ${tr("Rider")}: ${safe(row.rider_name)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading customer portal...") : tr("No returned records found.")}
              </div>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}
