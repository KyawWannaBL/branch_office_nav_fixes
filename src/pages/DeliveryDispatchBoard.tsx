import { readApiJson } from "@/lib/readApiJson";
import React, { useEffect, useMemo, useState } from "react";
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

export default function DeliveryDispatchBoard() {
  const { lang, t: tr } = useT();
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    route_date: new Date().toISOString().slice(0, 10),
    hub_code: "YGN",
    rider_name: "",
    rider_phone: "",
    vehicle_no: "",
    zone_code: "",
    remarks: "",
  });

  async function loadQueue() {
    const res = await fetch("/api/v1/deliveries/workflow");
    const data = await readApiJson(res);

    const rows = Array.isArray(data?.data) ? data.data : [];
    setQueue(
      rows.filter((row: any) => {
        const status = String(
          row.delivery_status || row.status || ""
        ).toUpperCase();
        return (
          ["SUBMITTED", "SAVED", "IN_TRANSIT"].includes(status) &&
          !row.run_sheet_id
        );
      })
    );
  }

  async function loadSheets() {
    try {
      const res = await fetch("/api/v1/delivery-run-sheets");
      const data = await readApiJson(res);
      setSheets(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setSheets([]);
    }
  }

  async function refreshAll() {
    setMessage("");
    try {
      await Promise.all([loadQueue(), loadSheets()]);
    } catch (error: any) {
      setMessage(normalizeError(error, "Failed to refresh dispatch board"));
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const filteredQueue = useMemo(() => {
    const q = search.toLowerCase();
    return queue.filter((row: any) =>
      [
        row.delivery_id,
        row.pickup_id,
        row.receiver_name,
        row.receiver_phone,
        row.receiver_township,
        row.township,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [queue, search]);

  function toggleId(deliveryId: string) {
    setSelectedIds((prev) =>
      prev.includes(deliveryId)
        ? prev.filter((x) => x !== deliveryId)
        : [...prev, deliveryId]
    );
  }

  async function submit(action: "create_run_sheet" | "dispatch_run_sheet") {
    setMessage("");
    try {
      const res = await fetch("/api/v1/delivery-run-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          batch: form,
          delivery_ids: selectedIds,
        }),
      });

      const data = await readApiJson(res);

      setMessage(
        action === "dispatch_run_sheet"
          ? `Run sheet dispatched: ${data.data.run_sheet_id}`
          : `Run sheet created: ${data.data.run_sheet_id}`
      );

      setSelectedIds([]);
      await refreshAll();
    } catch (error: any) {
      setMessage(normalizeError(error, "Failed to submit run sheet"));
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
            {tr("Delivery Dispatch")}
          </div>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: 30,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {tr("Run Sheet Management and Bulk Rider Dispatch")}
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
              "Build one Run Sheet for many delivery IDs, assign rider details, and dispatch them to Out for Delivery in batch."
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(380px, 1fr) minmax(0, 1.1fr)",
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
              {tr("Dispatch Queue")}
            </div>
            <input
              style={{ ...inputStyle, maxWidth: 240 }}
              placeholder={tr("Search queue...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 760,
              overflow: "auto",
            }}
          >
            {filteredQueue.map((row: any) => {
              const checked = selectedIds.includes(row.delivery_id);
              return (
                <label
                  key={row.delivery_id}
                  style={{
                    border: checked
                      ? "1px solid #93c5fd"
                      : "1px solid #dbe4ee",
                    borderRadius: 18,
                    background: checked ? "#eff6ff" : "#fff",
                    padding: 14,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId(row.delivery_id)}
                    style={{ marginTop: 4 }}
                  />
                  <div style={{ flex: 1 }}>
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
                        {statusText(lang, row.delivery_status || row.status)}
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
                  </div>
                </label>
              );
            })}
            {!filteredQueue.length && (
              <div
                style={{ textAlign: "center", color: "#64748b", padding: 18 }}
              >
                {tr("No eligible deliveries in queue.")}
              </div>
            )}
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <section style={card}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 16,
              }}
            >
              {tr("Run Sheet Form")}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <input
                style={inputStyle}
                type="date"
                value={form.route_date}
                onChange={(e) =>
                  setForm({ ...form, route_date: e.target.value })
                }
              />
              <input
                style={inputStyle}
                placeholder={tr("Hub")}
                value={form.hub_code}
                onChange={(e) =>
                  setForm({ ...form, hub_code: e.target.value })
                }
              />
              <input
                style={inputStyle}
                placeholder={tr("Rider Name")}
                value={form.rider_name}
                onChange={(e) =>
                  setForm({ ...form, rider_name: e.target.value })
                }
              />
              <input
                style={inputStyle}
                placeholder={tr("Rider Phone")}
                value={form.rider_phone}
                onChange={(e) =>
                  setForm({ ...form, rider_phone: e.target.value })
                }
              />
              <input
                style={inputStyle}
                placeholder={tr("Vehicle No")}
                value={form.vehicle_no}
                onChange={(e) =>
                  setForm({ ...form, vehicle_no: e.target.value })
                }
              />
              <input
                style={inputStyle}
                placeholder={tr("Zone / Route")}
                value={form.zone_code}
                onChange={(e) =>
                  setForm({ ...form, zone_code: e.target.value })
                }
              />
            </div>

            <textarea
              style={{ ...inputStyle, minHeight: 90, marginTop: 12 }}
              placeholder={tr("Remarks")}
              value={form.remarks}
              onChange={(e) =>
                setForm({ ...form, remarks: e.target.value })
              }
            />

            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "#475569",
                fontWeight: 700,
              }}
            >
              {tr("Selected deliveries")}: {selectedIds.length}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button
                type="button"
                style={primaryBtn}
                onClick={() => submit("create_run_sheet")}
              >
                {tr("Create Run Sheet")}
              </button>
              <button
                type="button"
                style={secondaryBtn}
                onClick={() => submit("dispatch_run_sheet")}
              >
                {tr("Dispatch Run Sheet")}
              </button>
            </div>
          </section>

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
                {tr("Existing Run Sheets")}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>
                {sheets.length} sheet(s)
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 420,
                overflow: "auto",
              }}
            >
              {sheets.map((sheet: any) => (
                <div
                  key={sheet.run_sheet_id}
                  style={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 18,
                    background: "#f8fafc",
                    padding: 14,
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
                      {safe(sheet.run_sheet_id)}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                      }}
                    >
                      {statusText(lang, sheet.status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: "#334155" }}>
                    {safe(sheet.route_date)} · {safe(sheet.hub_code)} ·{" "}
                    {tr("Rider")}: {safe(sheet.rider_name)}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    Items:{" "}
                    {Array.isArray(sheet.delivery_run_sheet_items)
                      ? sheet.delivery_run_sheet_items.length
                      : 0}
                  </div>
                </div>
              ))}
              {!sheets.length && (
                <div
                  style={{ textAlign: "center", color: "#64748b", padding: 18 }}
                >
                  {tr("No run sheets created yet.")}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}