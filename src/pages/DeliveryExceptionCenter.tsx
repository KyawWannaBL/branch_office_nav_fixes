import { readApiJson } from "@/lib/readApiJson";
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

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
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
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 18,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function DeliveryExceptionCenter() {
  const { lang, t: tr } = useT();
  const [tab, setTab] = useState<"failed" | "returned" | "pod">("failed");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [reattemptAt, setReattemptAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [reattemptNote, setReattemptNote] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [rtsReason, setRtsReason] = useState("");

  async function loadRows() {
    const qs = new URLSearchParams();
    qs.set("queue", tab);
    if (search.trim()) qs.set("q", search.trim());

    const res = await fetch(`/api/v1/delivery-exceptions?${qs.toString()}`);
    const data = await readApiJson(res);

    const list = Array.isArray(data?.data) ? data.data : [];
    setRows(list);

    setSelected((prev: any) => {
      if (!list.length) return null;
      if (!prev) return list[0];
      return list.find((x: any) => x.delivery_id === prev.delivery_id) || list[0];
    });
  }

  useEffect(() => {
    let active = true;
    setMessage("");

    (async () => {
      try {
        await loadRows();
      } catch (error: any) {
        if (!active) return;
        setMessage(normalizeError(error, "Failed to load queue"));
      }
    })();

    return () => {
      active = false;
    };
  }, [tab, search]);

  async function runAction(
    action: "schedule_reattempt" | "verify_pod" | "reject_pod" | "mark_rts"
  ) {
    if (!selected?.delivery_id) return;
    setMessage("");

    try {
      const body: any = {
        action,
        delivery_id: selected.delivery_id,
        reattempt_scheduled_at: reattemptAt
          ? new Date(reattemptAt).toISOString()
          : "",
        reattempt_note: reattemptNote,
        reviewed_by: reviewedBy,
        review_note: reviewNote,
        rts_reason: rtsReason,
      };

      const res = await fetch("/api/v1/delivery-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await readApiJson(res);

      setSelected(data.data);
      setMessage(`Action completed: ${action} for ${data.data.delivery_id}`);
      await loadRows();
    } catch (error: any) {
      setMessage(normalizeError(error, "Failed to run exception action"));
    }
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
            {tr("Delivery Exception Center")}
          </div>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: 30,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {tr("Failed Attempts, POD Review, and Return to Sender")}
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {tr(
              "Manage delivery exceptions, schedule reattempts, review POD, and process returned items."
            )}
          </p>
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
          {message}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["failed", "Failed Attempts"],
          ["returned", "Returned / RTS"],
          ["pod", "POD Review"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
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
            {tr(label)}
          </button>
        ))}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px,.95fr) minmax(0,1.15fr)",
          gap: 18,
        }}
      >
        <section style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
              {tr("Exception Queue")}
            </div>
            <input
              style={{ ...inputStyle, maxWidth: 240 }}
              placeholder={tr("Search delivery...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 720,
              overflow: "auto",
            }}
          >
            {rows.map((row: any) => {
              const active = selected?.delivery_id === row.delivery_id;
              return (
                <button
                  key={row.delivery_id}
                  type="button"
                  onClick={() => setSelected(row)}
                  style={{
                    textAlign: "left",
                    border: active
                      ? "1px solid #93c5fd"
                      : "1px solid #dbe4ee",
                    borderRadius: 18,
                    background: active ? "#eff6ff" : "#fff",
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      {safe(row.delivery_id)}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                      }}
                    >
                      {statusText(lang, row.delivery_status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: "#334155" }}>
                    {safe(row.receiver_name)}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    {safe(row.pickup_id)} ·{" "}
                    {safe(row.receiver_township || row.township)}
                  </div>
                </button>
              );
            })}
            {!rows.length && (
              <div
                style={{ textAlign: "center", color: "#64748b", padding: 18 }}
              >
                {tr("No exception rows found.")}
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            ...card,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
            {tr("Exception Action Panel")}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <Metric label={tr("Delivery ID")} value={safe(selected?.delivery_id)} strong />
            <Metric label={tr("Pickup ID")} value={safe(selected?.pickup_id)} />
            <Metric
              label={tr("Status")}
              value={statusText(lang, selected?.delivery_status)}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <input
              style={inputStyle}
              type="datetime-local"
              value={reattemptAt}
              onChange={(e) => setReattemptAt(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder={tr("Reviewed by")}
              value={reviewedBy}
              onChange={(e) => setReviewedBy(e.target.value)}
            />
          </div>

          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            placeholder={tr("Reattempt note / review note")}
            value={reattemptNote}
            onChange={(e) => setReattemptNote(e.target.value)}
          />
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            placeholder={tr("POD review note")}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            placeholder={tr("RTS reason")}
            value={rtsReason}
            onChange={(e) => setRtsReason(e.target.value)}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={primaryBtn} onClick={() => runAction("schedule_reattempt")}>
              {tr("Schedule Reattempt")}
            </button>
            <button type="button" style={primaryBtn} onClick={() => runAction("verify_pod")}>
              {tr("Verify POD")}
            </button>
            <button type="button" style={secondaryBtn} onClick={() => runAction("reject_pod")}>
              {tr("Reject POD")}
            </button>
            <button type="button" style={secondaryBtn} onClick={() => runAction("mark_rts")}>
              {tr("Mark RTS")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}