import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
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

async function fetchPortal(q = "", selectedDeliveryId = "") {
  const qs = new URLSearchParams();
  if (q.trim()) qs.set("q", q.trim());
  if (selectedDeliveryId) qs.set("selected_delivery_id", selectedDeliveryId);

  const res = await fetch(`/api/v1/customer-service/portal?${qs.toString()}`, {
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  const trimmed = String(text || "").trim();

  if (!res.ok) {
    throw new Error(trimmed || `${res.status} ${res.statusText}`);
  }

  if (!trimmed) return { ok: true, data: {} };

  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    throw new Error("Customer service API returned HTML instead of JSON");
  }

  return JSON.parse(trimmed);
}

async function postAction(body: Record<string, any>) {
  const res = await fetch("/api/v1/customer-service/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const trimmed = String(text || "").trim();

  if (!res.ok) {
    throw new Error(trimmed || `${res.status} ${res.statusText}`);
  }

  if (!trimmed) return { ok: true };
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    throw new Error("Customer service action API returned HTML instead of JSON");
  }

  return JSON.parse(trimmed);
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
  active = false,
  onClick,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 14,
        background: active ? "#eff6ff" : "#f8fafc",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
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

export default function CustomerServicePortal() {
  const { lang, t: tr } = useT();

  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<any>(null);
  const [selectedId, setSelectedId] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [updatedAddress, setUpdatedAddress] = useState("");
  const [updatedTownship, setUpdatedTownship] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData(search = query, focusId = selectedId) {
    setLoading(true);
    try {
      const data = await fetchPortal(search, focusId);
      setPayload(data.data || {});
      const selected = data.data?.selected || null;
      setSelectedId(selected?.delivery_id || "");
      setUpdatedAddress(selected?.receiver_address || "");
      setUpdatedTownship(selected?.receiver_township || "");
      const warnings = Array.isArray(data.data?.warnings) ? data.data.warnings : [];
      if (warnings.length) {
        setMessage(`Some sources were unavailable: ${warnings.slice(0, 3).join(" | ")}`);
      } else {
        setMessage("");
      }
    } catch (error: any) {
      setMessage(error?.message || "Failed to load customer service portal");
      setPayload(null);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string) {
    if (!selectedId) {
      setMessage("Select a shipment first.");
      return;
    }

    try {
      const data = await postAction({
        action,
        delivery_id: selectedId,
        note: actionNote,
        updated_address: updatedAddress,
        updated_township: updatedTownship,
      });

      setMessage(data?.message || "Action completed");
      await loadData(query, selectedId);
    } catch (error: any) {
      setMessage(error?.message || "Customer service action failed");
    }
  }

  useEffect(() => {
    void loadData("", "");
  }, []);

  const lookupResults = payload?.lookup_results || [];
  const selected = payload?.selected || null;
  const timeline = payload?.timeline || [];
  const evidence = payload?.evidence || [];
  const merchantChildren = payload?.merchant_children || [];
  const failedQueue = payload?.failed_queue || [];
  const podReviewQueue = payload?.pod_review_queue || [];
  const returnedQueue = payload?.returned_queue || [];
  const slaQueue = payload?.sla_queue || [];
  const kpis = payload?.kpis || {};

  const openSupportQueues = useMemo(() => {
    const ids = new Set<string>();
    [...failedQueue, ...podReviewQueue, ...returnedQueue, ...slaQueue].forEach((x: AnyRow) =>
      ids.add(String(x.delivery_id || ""))
    );
    return ids.size;
  }, [failedQueue, podReviewQueue, returnedQueue, slaQueue]);

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
            {tr("Customer Service")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Customer Service Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Handle customer shipment inquiries, delivery follow-up, POD review, and failed-attempt escalation from one support workspace.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(query, selectedId)}
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
            {tr("Shipment Lookup")}
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
          onClick={() => void loadData(query, selectedId)}
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
            void loadData("", "");
          }}
          style={secondaryBtn}
        >
          {tr("Clear")}
        </button>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<ClipboardList size={18} />} label={tr("Lookup Results")} value={String(kpis.lookup_results || 0)} tone="info" />
        <KpiCard icon={<ShieldCheck size={18} />} label={tr("Delivered Visible")} value={String(kpis.delivered_visible || 0)} tone="good" />
        <KpiCard icon={<AlertTriangle size={18} />} label={tr("Open Support Queues")} value={String(openSupportQueues)} tone="warn" />
        <KpiCard icon={<Truck size={18} />} label={tr("POD Review Queue")} value={String(kpis.pod_review_queue || 0)} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel
            title={tr("Shipment Lookup Results")}
            action={
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                {lookupResults.length} result(s)
              </span>
            }
          >
            {lookupResults.length ? (
              lookupResults.map((row: AnyRow) => (
                <RowCard
                  key={row.delivery_id}
                  active={selectedId === row.delivery_id}
                  onClick={() => void loadData(query, row.delivery_id)}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_phone)}`}
                  line2={`${safe(row.pickup_id)} · ${safe(row.receiver_township)} · ${tr("Merchant")}: ${safe(row.merchant_name)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading customer service portal...") : tr("No shipment records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Failed Attempt Queue")}>
            {failedQueue.length ? (
              failedQueue.map((row: AnyRow) => (
                <RowCard
                  key={`failed-${row.delivery_id}`}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township)}`}
                  line2={`${tr("Rider")}: ${safe(row.rider_name)} · ${tr("Updated")}: ${safe(row.updated_at)}`}
                  onClick={() => void loadData(query, row.delivery_id)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No failed-attempt records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("SLA Breach Queue")}>
            {slaQueue.length ? (
              slaQueue.map((row: AnyRow) => (
                <RowCard
                  key={`sla-${row.delivery_id}`}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township)}`}
                  line2={`${tr("Updated")}: ${safe(row.updated_at)}`}
                  onClick={() => void loadData(query, row.delivery_id)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No SLA breach records found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Customer Service Detail")}>
            {selected ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <DetailMetric label={tr("Delivery ID")} value={safe(selected.delivery_id)} />
                  <DetailMetric label={tr("Pickup ID")} value={safe(selected.pickup_id)} />
                  <DetailMetric label={tr("Status")} value={statusText(lang, selected.delivery_status)} />
                  <DetailMetric label={tr("Merchant")} value={safe(selected.merchant_name)} />
                  <DetailMetric label={tr("Receiver")} value={safe(selected.receiver_name)} />
                  <DetailMetric label={tr("Receiver Phone")} value={safe(selected.receiver_phone)} />
                  <DetailMetric label={tr("Township")} value={safe(selected.receiver_township)} />
                  <DetailMetric label={tr("Rider")} value={`${safe(selected.rider_name)} / ${safe(selected.rider_phone)}`} />
                  <DetailMetric label={tr("COD Amount")} value={`${money(selected.cod_amount || 0)} MMK`} />
                  <DetailMetric
                    label={tr("Delivery Fee")}
                    value={`${money((selected.base_fee || 0) + (selected.surcharge || 0))} MMK`}
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, color: "#475569" }}>
                    {tr("Receiver Address")}
                  </div>
                  <div style={{ border: "1px solid #dbe4ee", borderRadius: 14, padding: 12, background: "#f8fafc" }}>
                    {safe(selected.receiver_address)}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
                      {tr("Updated Address")}
                    </div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 92 }}
                      value={updatedAddress}
                      onChange={(e) => setUpdatedAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
                      {tr("Updated Township")}
                    </div>
                    <input
                      style={inputStyle}
                      value={updatedTownship}
                      onChange={(e) => setUpdatedTownship(e.target.value)}
                    />
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginTop: 12, marginBottom: 6 }}>
                      {tr("Action Note")}
                    </div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 92 }}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" style={primaryBtn} onClick={() => void runAction("reattempt")}>
                    {tr("Re-attempt Delivery")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("rts")}>
                    {tr("Return to Sender")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("update_address")}>
                    {tr("Update Address")}
                  </button>
                  <button
                    type="button"
                    style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}
                    onClick={() => void runAction("ping_rider")}
                  >
                    <PhoneCall size={16} />
                    {tr("Ping Rider")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("rescue")}>
                    {tr("Emergency Rescue")}
                  </button>
                  <button type="button" style={secondaryBtn} onClick={() => void runAction("reroute_branch")}>
                    {tr("Re-route Branch")}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("Select a shipment to view details.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Live Timeline")}>
            {timeline.length ? (
              timeline.map((row: AnyRow, index: number) => (
                <div
                  key={`${row.source}-${index}-${row.created_at}`}
                  style={{
                    borderLeft: "3px solid #cbd5e1",
                    paddingLeft: 12,
                    marginLeft: 4,
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{safe(row.action)}</div>
                  <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>
                    {safe(row.actor_name)} · {safe(row.actor_role)} · {safe(row.created_at)}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    {safe(row.from_value, "")} {row.from_value || row.to_value ? "→" : ""} {safe(row.to_value, "")}
                  </div>
                  {row.note ? (
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {safe(row.note)}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No timeline records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Evidence Gallery")}>
            {evidence.length ? (
              evidence.map((row: AnyRow) => (
                <a
                  key={row.id}
                  href={row.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    border: "1px solid #dbe4ee",
                    borderRadius: 14,
                    padding: 12,
                    background: "#f8fafc",
                    color: "#0f172a",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{safe(row.attachment_type)}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    {safe(row.reference_type)} · {safe(row.created_at)}
                  </div>
                </a>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No evidence attachments found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Merchant Batch View")}>
            {merchantChildren.length ? (
              merchantChildren.map((row: AnyRow) => (
                <RowCard
                  key={`child-${row.delivery_id}`}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township)}`}
                  line2={`${tr("COD")}: ${money(row.cod_amount || 0)} MMK`}
                  onClick={() => void loadData(query, row.delivery_id)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No related pickup-child deliveries found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("POD Review Queue")}>
            {podReviewQueue.length ? (
              podReviewQueue.map((row: AnyRow) => (
                <RowCard
                  key={`pod-${row.delivery_id}`}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township)}`}
                  line2={`${tr("Rider")}: ${safe(row.rider_name)}`}
                  onClick={() => void loadData(query, row.delivery_id)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No POD review records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Returned Queue")}>
            {returnedQueue.length ? (
              returnedQueue.map((row: AnyRow) => (
                <RowCard
                  key={`return-${row.delivery_id}`}
                  title={safe(row.delivery_id)}
                  badge={statusText(lang, row.delivery_status)}
                  line1={`${safe(row.receiver_name)} · ${safe(row.receiver_township)}`}
                  line2={`${tr("Rider")}: ${safe(row.rider_name)}`}
                  onClick={() => void loadData(query, row.delivery_id)}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No returned records found.")}
              </div>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}
