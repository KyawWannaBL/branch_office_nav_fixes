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

function num(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(v: any) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num(v));
}

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

export default function CodSettlementCenter() {
  const { lang, t: tr } = useT();
  const [tab, setTab] = useState<"queue" | "batches">("queue");
  const [queue, setQueue] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [batchForm, setBatchForm] = useState({
    settlement_date: new Date().toISOString().slice(0, 10),
    hub_code: "YGN",
    rider_name: "",
    rider_phone: "",
    note: "",
  });

  async function loadQueue() {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);

  const res = await fetch("/api/...");
  const data = await readApiJson(res);
    setQueue(Array.isArray(data?.data) ? data.data : []);
  }

  async function loadBatches() {
    const res = await fetch("/api/v1/cod-settlements?mode=batches");
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load settlement batches");
    setBatches(Array.isArray(data?.data) ? data.data : []);
  }

  async function refreshAll() {
    setMessage("");
    try {
      await Promise.all([loadQueue(), loadBatches()]);
    } catch (error: any) {
      setMessage(error?.message || "Failed to refresh COD settlement center");
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
        row.rider_name,
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

  async function updateCod(row: any, collectedAmount: number) {
    setMessage("");
    try {
      const res = await fetch("/api/v1/cod-settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_delivery_cod",
          delivery_id: row.delivery_id,
          cod_collected_amount: collectedAmount,
          cod_collected_by: batchForm.rider_name || row.rider_name || "",
          settlement_note: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update COD");
      setMessage(`Updated COD for ${data.data.delivery_id}`);
      await loadQueue();
    } catch (error: any) {
      setMessage(error?.message || "Failed to update COD");
    }
  }

  async function createBatch(action: "create_settlement" | "post_settlement") {
    setMessage("");
    try {
      const items = filteredQueue
        .filter((row: any) => selectedIds.includes(row.delivery_id))
        .map((row: any) => ({
          delivery_id: row.delivery_id,
          expected_amount: num(row.waybill_total_cod || row.receivable || 0),
          collected_amount: num(row.cod_collected_amount || row.waybill_total_cod || row.receivable || 0),
          cod_collected_at: row.cod_collected_at || new Date().toISOString(),
          cod_collected_by: batchForm.rider_name || row.rider_name || "",
          note: row.settlement_note || "",
        }));

      const res = await fetch("/api/v1/cod-settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          batch: batchForm,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to process settlement");

      setMessage(
        action === "post_settlement"
          ? `Settlement posted: ${data.data.settlement_batch_id}`
          : `Settlement created: ${data.data.settlement_batch_id}`
      );

      setSelectedIds([]);
      await refreshAll();
    } catch (error: any) {
      setMessage(error?.message || "Failed to process settlement");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            COD Reconciliation & Settlement
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            Rider Cash Handover and COD Settlement Center
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            Reconcile COD collections, create settlement batches, and close rider cash handovers with discrepancy tracking.
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8 }}>
        <button onClick={() => setTab("queue")} style={{ border: "none", borderRadius: 14, padding: "12px 16px", fontWeight: 800, cursor: "pointer", background: tab === "queue" ? "#0f2f5c" : "#f8fafc", color: tab === "queue" ? "#fff" : "#475569" }}>
          COD Queue
        </button>
        <button onClick={() => setTab("batches")} style={{ border: "none", borderRadius: 14, padding: "12px 16px", fontWeight: 800, cursor: "pointer", background: tab === "batches" ? "#0f2f5c" : "#f8fafc", color: tab === "batches" ? "#fff" : "#475569" }}>
          Settlement Batches
        </button>
      </section>

      {tab === "queue" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(380px,1fr) minmax(0,1.1fr)", gap: 18 }}>
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>COD Queue</div>
              <input style={{ ...inputStyle, maxWidth: 240 }} placeholder={tr("Search queue...")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 760, overflow: "auto" }}>
              {filteredQueue.map((row: any) => {
                const checked = selectedIds.includes(row.delivery_id);
                const expected = num(row.waybill_total_cod || row.receivable || 0);
                return (
                  <label key={row.delivery_id} style={{ border: checked ? "1px solid #93c5fd" : "1px solid #dbe4ee", borderRadius: 18, background: checked ? "#eff6ff" : "#fff", padding: 14, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleId(row.delivery_id)} style={{ marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong style={{ color: "#0f172a" }}>{safe(row.delivery_id)}</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                          {safe(row.settlement_status)}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, color: "#334155" }}>{safe(row.receiver_name)} · Rider: {safe(row.rider_name)}</div>
                      <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>Expected COD: {money(expected)}</div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          style={{ border: "none", borderRadius: 10, background: "#0f766e", color: "#fff", padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}
                          onClick={(e) => {
                            e.preventDefault();
                            updateCod(row, expected);
                          }}
                        >
                          Mark Full Collected
                        </button>
                      </div>
                    </div>
                  </label>
                );
              })}
              {!filteredQueue.length && <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>No COD deliveries found.</div>}
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <section style={card}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 16 }}>Settlement Batch Form</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
                <input style={inputStyle} type="date" value={batchForm.settlement_date} onChange={(e) => setBatchForm({ ...batchForm, settlement_date: e.target.value })} />
                <input style={inputStyle} placeholder="Hub Code" value={batchForm.hub_code} onChange={(e) => setBatchForm({ ...batchForm, hub_code: e.target.value })} />
                <input style={inputStyle} placeholder={tr("Rider Name")} value={batchForm.rider_name} onChange={(e) => setBatchForm({ ...batchForm, rider_name: e.target.value })} />
                <input style={inputStyle} placeholder={tr("Rider Phone")} value={batchForm.rider_phone} onChange={(e) => setBatchForm({ ...batchForm, rider_phone: e.target.value })} />
              </div>

              <textarea style={{ ...inputStyle, minHeight: 90, marginTop: 12 }} placeholder={tr("Settlement note")} value={batchForm.note} onChange={(e) => setBatchForm({ ...batchForm, note: e.target.value })} />

              <div style={{ marginTop: 16, fontSize: 13, color: "#475569", fontWeight: 700 }}>
                Selected deliveries: {selectedIds.length}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <button style={primaryBtn} onClick={() => createBatch("create_settlement")}>{tr("Create Settlement")}</button>
                <button style={secondaryBtn} onClick={() => createBatch("post_settlement")}>{tr("Post Settlement")}</button>
              </div>
            </section>
          </section>
        </div>
      )}

      {tab === "batches" && (
        <section style={card}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 16 }}>Settlement Batches</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {batches.map((batch: any) => (
              <div key={batch.settlement_batch_id} style={{ border: "1px solid #dbe4ee", borderRadius: 18, background: "#f8fafc", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ color: "#0f172a" }}>{safe(batch.settlement_batch_id)}</strong>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>{statusText(lang, batch.status)}</span>
                </div>
                <div style={{ marginTop: 6, color: "#334155" }}>
                  {safe(batch.settlement_date)} · {safe(batch.hub_code)} · Rider: {safe(batch.rider_name)}
                </div>
                <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                  Expected: {money(batch.expected_amount)} · Collected: {money(batch.collected_amount)} · Shortage: {money(batch.shortage_amount)}
                </div>
              </div>
            ))}
            {!batches.length && <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>No settlement batches found.</div>}
          </div>
        </section>
      )}
    </div>
  );
}

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
