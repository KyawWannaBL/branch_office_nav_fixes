// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 14,
  fontFamily: "inherit",
};

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

export default function WayManagement() {
  const { lang, t: tr } = useT();

  const [tab, setTab] = useState<"queue" | "bulk" | "rider" | "route" | "dispatch" | "print" | "scan" | "dispatchscan" | "closeout" | "history">("queue");
  const [rows, setRows] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedWay, setSelectedWay] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [routeGroups, setRouteGroups] = useState<any[]>([]);
  const [dispatchBatches, setDispatchBatches] = useState<any[]>([]);
  const [selectedPrintBatchId, setSelectedPrintBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  const [bulkStatus, setBulkStatus] = useState("OUT_FOR_DELIVERY");
  const [bulkNote, setBulkNote] = useState("");

  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderNote, setRiderNote] = useState("");

  const [printedBy, setPrintedBy] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [dispatchHub, setDispatchHub] = useState("YGN");
  const [dispatchTownship, setDispatchTownship] = useState("");
  const [dispatchZone, setDispatchZone] = useState("");
  const [dispatchVehicle, setDispatchVehicle] = useState("");
  const [dispatchNote, setDispatchNote] = useState("");

  const [scanCode, setScanCode] = useState("");
  const [scanType, setScanType] = useState("VERIFY");
  const [scannedBy, setScannedBy] = useState("");
  const [scanNote, setScanNote] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [dispatchScanCode, setDispatchScanCode] = useState("");
  const [dispatchScannedBy, setDispatchScannedBy] = useState("");
  const [dispatchScanNote, setDispatchScanNote] = useState("");
  const [dispatchScanResult, setDispatchScanResult] = useState<any>(null);
  const [closeoutBatchId, setCloseoutBatchId] = useState("");
  const [closeoutReturnedBy, setCloseoutReturnedBy] = useState("");
  const [closeoutCollected, setCloseoutCollected] = useState("");
  const [closeoutNote, setCloseoutNote] = useState("");
  const [closeoutResult, setCloseoutResult] = useState<any>(null);
  const [sequenceTownship, setSequenceTownship] = useState("");
  const [sequenceRows, setSequenceRows] = useState<any[]>([]);

  const statusOptions = [
    "",
    "DRAFT",
    "SAVED",
    "SUBMITTED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED_ATTEMPT",
    "RETURNED",
    "CANCELLED",
  ];

  const scanTypeOptions = [
    "VERIFY",
    "STAGING_IN",
    "OUTBOUND_SCAN",
    "OUT_FOR_DELIVERY",
  ];

  async function loadWays() {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (statusFilter) qs.set("status", statusFilter);

    const res = await fetch(`/api/v1/ways/list?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    const list = Array.isArray(data?.data) ? data.data : [];
    setRows(list);
    if (list.length && !selectedWay) setSelectedWay(list[0]);
  }

  async function loadHistory(deliveryId: string) {
    const res = await fetch(`/api/v1/ways/history?delivery_id=${encodeURIComponent(deliveryId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    setHistoryRows(Array.isArray(data?.data) ? data.data : []);
  }


  async function loadDispatchBatches() {
    const res = await fetch("/api/v1/ways/dispatch-batches");
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    setDispatchBatches(Array.isArray(data?.data) ? data.data : []);
  }

  async function createDispatchBatch() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/dispatch-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_ids: selectedIds,
          dispatch_date: dispatchDate,
          hub_code: dispatchHub,
          township: dispatchTownship,
          zone_code: dispatchZone,
          rider_name: riderName,
          rider_phone: riderPhone,
          vehicle_no: dispatchVehicle,
          note: dispatchNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.data.dispatch_batch_id}`);
      await loadWays();
      await loadDispatchBatches();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }


  async function loadSequencePlan(townshipValue?: string) {
    const qs = new URLSearchParams();
    const val = townshipValue ?? sequenceTownship;
    if (val) qs.set("township", val);

    const res = await fetch(`/api/v1/ways/sequence?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    setSequenceRows(Array.isArray(data?.data) ? data.data : []);
  }

  async function saveSequencePlan() {
    setMessage("");
    try {
      const payload = sequenceRows.map((row: any, idx: number) => ({
        delivery_id: row.delivery_id,
        route_sequence: Number(row.route_sequence || row.suggested_sequence || idx + 1),
      }));

      const res = await fetch("/api/v1/ways/sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.updated} ways updated`);
      await loadWays();
      await loadRoutePlan();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }


  async function loadSequencePlan(townshipValue?: string) {
    const qs = new URLSearchParams();
    const val = townshipValue ?? sequenceTownship;
    if (val) qs.set("township", val);

    const res = await fetch(`/api/v1/ways/sequence?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    setSequenceRows(Array.isArray(data?.data) ? data.data : []);
  }

  async function saveSequencePlan() {
    setMessage("");
    try {
      const payload = sequenceRows.map((row: any, idx: number) => ({
        delivery_id: row.delivery_id,
        route_sequence: Number(row.route_sequence || row.suggested_sequence || idx + 1),
      }));

      const res = await fetch("/api/v1/ways/sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.updated} ways updated`);
      await loadWays();
      await loadRoutePlan();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  async function loadRoutePlan() {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (statusFilter) qs.set("status", statusFilter);

    const res = await fetch(`/api/v1/ways/route-plan?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load");
    setRouteGroups(Array.isArray(data?.data) ? data.data : []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadWays();
      } catch (error: any) {
        if (!active) return;
        setMessage(error?.message || "Failed to load");
      }
    })();
    return () => { active = false; };
  }, []);

  const filteredRows = useMemo(() => rows, [rows]);

  function toggleId(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function runBulkStatus() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_ids: selectedIds, to_status: bulkStatus, note: bulkNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.updated} ways updated`);
      await loadWays();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  async function runAssignRider() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/assign-rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_ids: selectedIds,
          rider_name: riderName,
          rider_phone: riderPhone,
          note: riderNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.updated} ways updated`);
      await loadWays();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }



  function openPrintBatchLayout(type: string) {
    if (!selectedPrintBatchId) {
      setMessage("No dispatch batch selected.");
      return;
    }
    const url = `/api/v1/ways/print-layout?type=${encodeURIComponent(type)}&dispatch_batch_id=${encodeURIComponent(selectedPrintBatchId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openPrintLayout(type: string) {
    const ids = selectedIds.join(",");
    if (!ids) {
      setMessage("No records found for this queue.");
      return;
    }
    const url = `/api/v1/ways/print-layout?type=${encodeURIComponent(type)}&delivery_ids=${encodeURIComponent(ids)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function logPrint(printType: string) {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_ids: selectedIds,
          print_type: printType,
          printed_by: printedBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setMessage(`Action completed: ${data.logged} print logs saved`);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }




  function openDispatchCloseoutPrint() {
    const id = closeoutResult?.dispatch_batch_id || closeoutBatchId;
    if (!id) {
      setMessage("No dispatch batch selected.");
      return;
    }
    window.open(`/api/v1/ways/dispatch-closeout-print?dispatch_batch_id=${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
  }

  async function runDispatchCloseout() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/dispatch-closeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatch_batch_id: closeoutBatchId,
          returned_by: closeoutReturnedBy,
          cod_collected: closeoutCollected,
          note: closeoutNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setCloseoutResult(data.data);
      setMessage(`Action completed: ${data.data.dispatch_batch_id}`);
      await loadDispatchBatches();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  async function runDispatchScan() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/dispatch-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatch_batch_id: dispatchScanCode,
          scanned_by: dispatchScannedBy,
          note: dispatchScanNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setDispatchScanResult(data.data);
      setMessage(`Action completed: ${data.data.dispatch_batch_id}`);
      await loadWays();
      await loadDispatchBatches();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  async function runScan() {
    setMessage("");
    try {
      const res = await fetch("/api/v1/ways/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_code: scanCode,
          scan_type: scanType,
          scanned_by: scannedBy,
          note: scanNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setScanResult(data.data);
      setSelectedWay(data.data);
      setMessage(`Scanned ${data.data.delivery_id}`);
      await loadHistory(data.data.delivery_id).catch(() => setHistoryRows([]));
      await loadWays();
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            {tr("Way Management")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Way Management Operations Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Control way queue, bulk status updates, rider assignments, and audit trail from one operations workspace.")}
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["queue", "Queue"],
          ["bulk", "Bulk Actions"],
          ["rider", "Rider Assignment"],
          ["route", "Route Planning"],
          ["dispatch", "Dispatch Batches"],
          ["print", "Print Center"],
          ["scan", "Scan Screen"],
          ["dispatchscan", "Dispatch Scan"],
          ["closeout", "Batch Closeout"],
          ["history", "Audit Trail"],
        ].map(([key, label]) => (
          <button
            key={key}
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(380px,1fr) minmax(0,1.15fr)", gap: 18 }}>
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Way Queue")}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, width: 220 }} placeholder={tr("Search")} value={search} onChange={(e) => setSearch(e.target.value)} />
              <select style={{ ...inputStyle, width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s || "ALL"} value={s}>{s ? statusText(lang, s) : tr("All Statuses")}</option>
                ))}
              </select>
              <button style={secondaryBtn} onClick={loadWays}>{tr("Apply")}</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 760, overflow: "auto" }}>
            {filteredRows.map((row: any) => {
              const checked = selectedIds.includes(row.delivery_id);
              const active = selectedWay?.delivery_id === row.delivery_id;
              return (
                <div
                  key={row.delivery_id}
                  style={{
                    border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
                    borderRadius: 18,
                    background: active ? "#eff6ff" : "#fff",
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleId(row.delivery_id)} style={{ marginTop: 4 }} />
                    <button
                      onClick={() => {
                        setSelectedWay(row);
                        loadHistory(row.delivery_id).catch(() => setHistoryRows([]));
                      }}
                      style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", flex: 1 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong style={{ color: "#0f172a" }}>{safe(row.delivery_id)}</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                          {statusText(lang, row.delivery_status)}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, color: "#334155" }}>{safe(row.receiver_name)}</div>
                      <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                        {safe(row.pickup_id)} · {safe(row.receiver_township || row.township)} · {tr("Rider")}: {safe(row.rider_name)}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredRows.length && (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No records found for this queue.")}
              </div>
            )}
          </div>
        </section>

        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "queue" && selectedWay && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Queue Overview")}</div>
              <Metric label={tr("Delivery ID")} value={safe(selectedWay.delivery_id)} strong />
              <Metric label={tr("Pickup ID")} value={safe(selectedWay.pickup_id)} />
              <Metric label={tr("Status")} value={statusText(lang, selectedWay.delivery_status)} />
              <Metric label={tr("Receiver Name")} value={safe(selectedWay.receiver_name)} />
              <Metric label={tr("Receiver Phone")} value={safe(selectedWay.receiver_phone)} />
              <Metric label={tr("Township")} value={safe(selectedWay.receiver_township || selectedWay.township)} />
              <Metric label={tr("Rider")} value={safe(selectedWay.rider_name)} />
              <Metric label={tr("COD")} value={money(selectedWay.waybill_total_cod || selectedWay.receivable || 0)} />
            </>
          )}

          {tab === "bulk" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Bulk Actions")}</div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{tr("Selected deliveries")}: {selectedIds.length}</div>
              <select style={inputStyle} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                {statusOptions.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{statusText(lang, s)}</option>
                ))}
              </select>
              <textarea style={{ ...inputStyle, minHeight: 100 }} placeholder={tr("Notes / Remarks")} value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} />
              <button style={primaryBtn} onClick={runBulkStatus}>{tr("Apply")}</button>
            </>
          )}

          {tab === "rider" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Rider Assignment")}</div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{tr("Selected deliveries")}: {selectedIds.length}</div>
              <input style={inputStyle} placeholder={tr("Rider Name")} value={riderName} onChange={(e) => setRiderName(e.target.value)} />
              <input style={inputStyle} placeholder={tr("Rider Phone")} value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
              <textarea style={{ ...inputStyle, minHeight: 100 }} placeholder={tr("Notes / Remarks")} value={riderNote} onChange={(e) => setRiderNote(e.target.value)} />
              <button style={primaryBtn} onClick={runAssignRider}>{tr("Assign Rider")}</button>
            </>
          )}

          {tab === "route" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Route Planning")}</div>
                <button style={secondaryBtn} onClick={loadRoutePlan}>{tr("Refresh")}</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 560, overflow: "auto" }}>
                  {routeGroups.map((g: any) => (
                    <button
                      key={g.township}
                      onClick={() => {
                        setSequenceTownship(g.township);
                        loadSequencePlan(g.township).catch(() => setSequenceRows([]));
                      }}
                      style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 12, background: "#f8fafc", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{safe(g.township)}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{g.total_ways} way(s)</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                        {tr("COD")}: {money(g.total_cod)} · {tr("Weight")}: {money(g.total_weight)}
                      </div>
                    </button>
                  ))}
                  {!routeGroups.length && (
                    <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                      {tr("No records found for this queue.")}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                    {tr("Route Sequence")} {sequenceTownship ? `· ${sequenceTownship}` : ""}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflow: "auto" }}>
                    {sequenceRows.map((row: any, idx: number) => (
                      <div key={row.delivery_id} style={{ border: "1px solid #dbe4ee", borderRadius: 14, padding: 10, background: "#fff" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, alignItems: "center" }}>
                          <input
                            style={inputStyle}
                            type="number"
                            min="1"
                            value={row.route_sequence || row.suggested_sequence || idx + 1}
                            onChange={(e) => {
                              const val = Number(e.target.value || 0);
                              setSequenceRows((prev) =>
                                prev.map((x: any) =>
                                  x.delivery_id === row.delivery_id ? { ...x, route_sequence: val } : x
                                )
                              );
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{safe(row.delivery_id)}</div>
                            <div style={{ marginTop: 4, fontSize: 13, color: "#334155" }}>{safe(row.receiver_name)}</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                              {safe(row.receiver_township || row.township)} · {safe(row.receiver_address || row.delivery_address)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!sequenceRows.length && (
                      <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                        {tr("Select a township group to generate route sequence.")}
                      </div>
                    )}
                  </div>

                  <button style={primaryBtn} onClick={saveSequencePlan}>{tr("Save Route Sequence")}</button>
                </div>
              </div>
            </>
          )}


          {tab === "dispatch" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Dispatch Batches")}</div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{tr("Selected deliveries")}: {selectedIds.length}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input style={inputStyle} type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
                <input style={inputStyle} placeholder={tr("Hub")} value={dispatchHub} onChange={(e) => setDispatchHub(e.target.value)} />
                <input style={inputStyle} placeholder={tr("Township")} value={dispatchTownship} onChange={(e) => setDispatchTownship(e.target.value)} />
                <input style={inputStyle} placeholder={tr("Zone / Route")} value={dispatchZone} onChange={(e) => setDispatchZone(e.target.value)} />
                <input style={inputStyle} placeholder={tr("Vehicle No")} value={dispatchVehicle} onChange={(e) => setDispatchVehicle(e.target.value)} />
                <input style={inputStyle} placeholder={tr("Rider Name")} value={riderName} onChange={(e) => setRiderName(e.target.value)} />
              </div>
              <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder={tr("Notes / Remarks")} value={dispatchNote} onChange={(e) => setDispatchNote(e.target.value)} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={primaryBtn} onClick={createDispatchBatch}>{tr("Create Dispatch Batch")}</button>
                <button style={secondaryBtn} onClick={loadDispatchBatches}>{tr("Refresh")}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflow: "auto" }}>
                {dispatchBatches.map((b: any) => (
                  <div key={b.dispatch_batch_id} style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 12, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{safe(b.dispatch_batch_id)}</strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{statusText(lang, b.status)}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                      {safe(b.dispatch_date)} · {safe(b.hub_code)} · {safe(b.township)}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                      {tr("Rider")}: {safe(b.rider_name)} · {b.total_ways} way(s)
                    </div>
                  </div>
                ))}
                {!dispatchBatches.length && (
                  <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                    {tr("No records found for this queue.")}
                  </div>
                )}
              </div>
            </>
          )}


          {tab === "print" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Print Center")}</div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{tr("Selected deliveries")}: {selectedIds.length}</div>
              <input style={inputStyle} placeholder={tr("Printed by")} value={printedBy} onChange={(e) => setPrintedBy(e.target.value)} />

              <div style={{ fontSize: 14, fontWeight: 800, color: "#334155" }}>{tr("Print from selected way IDs")}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={primaryBtn} onClick={() => { openPrintLayout("MANIFEST"); logPrint("WAYBILL"); }}>{tr("Print Waybill")}</button>
                <button style={secondaryBtn} onClick={() => { openPrintLayout("MANIFEST"); logPrint("MANIFEST"); }}>{tr("Print Manifest")}</button>
                <button style={secondaryBtn} onClick={() => { openPrintLayout("ROUTE_SHEET"); logPrint("ROUTE_SHEET"); }}>{tr("Print Route Sheet")}</button>
              </div>

              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: "#334155" }}>{tr("Print from dispatch batch")}</div>
              <select style={inputStyle} value={selectedPrintBatchId} onChange={(e) => setSelectedPrintBatchId(e.target.value)}>
                <option value="">{tr("Select dispatch batch")}</option>
                {dispatchBatches.map((b: any) => (
                  <option key={b.dispatch_batch_id} value={b.dispatch_batch_id}>
                    {b.dispatch_batch_id} · {b.dispatch_date} · {b.township || "-"}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={primaryBtn} onClick={() => openPrintBatchLayout("MANIFEST")}>{tr("Print Batch Manifest")}</button>
                <button style={secondaryBtn} onClick={() => openPrintBatchLayout("ROUTE_SHEET")}>{tr("Print Batch Route Sheet")}</button>
              </div>
            </>
          )}

          {tab === "scan" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Scan Screen")}</div>
              <input style={inputStyle} placeholder={tr("Scan / enter Delivery ID or QR value")} value={scanCode} onChange={(e) => setScanCode(e.target.value)} />
              <select style={inputStyle} value={scanType} onChange={(e) => setScanType(e.target.value)}>
                {scanTypeOptions.map((s) => (
                  <option key={s} value={s}>{tr(s)}</option>
                ))}
              </select>
              <input style={inputStyle} placeholder={tr("Scanned by")} value={scannedBy} onChange={(e) => setScannedBy(e.target.value)} />
              <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder={tr("Notes / Remarks")} value={scanNote} onChange={(e) => setScanNote(e.target.value)} />
              <button style={primaryBtn} onClick={runScan}>{tr("Scan Delivery")}</button>

              {scanResult ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Metric label={tr("Delivery ID")} value={safe(scanResult.delivery_id)} strong />
                  <Metric label={tr("Pickup ID")} value={safe(scanResult.pickup_id)} />
                  <Metric label={tr("Status")} value={statusText(lang, scanResult.delivery_status)} />
                  <Metric label={tr("Rider")} value={safe(scanResult.rider_name)} />
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>{tr("No scan result yet.")}</div>
              )}
            </>
          )}


          {tab === "dispatchscan" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Dispatch Scan")}</div>
              <input style={inputStyle} placeholder={tr("Dispatch Batch ID")} value={dispatchScanCode} onChange={(e) => setDispatchScanCode(e.target.value)} />
              <input style={inputStyle} placeholder={tr("Scanned by")} value={dispatchScannedBy} onChange={(e) => setDispatchScannedBy(e.target.value)} />
              <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder={tr("Notes / Remarks")} value={dispatchScanNote} onChange={(e) => setDispatchScanNote(e.target.value)} />
              <button style={primaryBtn} onClick={runDispatchScan}>{tr("Start Dispatch from Batch Scan")}</button>

              {dispatchScanResult ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Metric label={tr("Dispatch Batch ID")} value={safe(dispatchScanResult.dispatch_batch_id)} strong />
                  <Metric label={tr("Status")} value={statusText(lang, dispatchScanResult.status)} />
                  <Metric label={tr("Selected deliveries")} value={safe(dispatchScanResult.total_ways)} />
                  <Metric label={tr("Scanned by")} value={safe(dispatchScanResult.dispatched_by)} />
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>{tr("No dispatch scan result yet.")}</div>
              )}
            </>
          )}



          {tab === "closeout" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Batch Closeout")}</div>
              <select style={inputStyle} value={closeoutBatchId} onChange={(e) => setCloseoutBatchId(e.target.value)}>
                <option value="">{tr("Select dispatch batch")}</option>
                {dispatchBatches.map((b: any) => (
                  <option key={b.dispatch_batch_id} value={b.dispatch_batch_id}>
                    {b.dispatch_batch_id} · {b.dispatch_date} · {b.township || "-"}
                  </option>
                ))}
              </select>
              <input style={inputStyle} placeholder={tr("Returned by")} value={closeoutReturnedBy} onChange={(e) => setCloseoutReturnedBy(e.target.value)} />
              <input style={inputStyle} placeholder={tr("COD Collected")} value={closeoutCollected} onChange={(e) => setCloseoutCollected(e.target.value)} />
              <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder={tr("Notes / Remarks")} value={closeoutNote} onChange={(e) => setCloseoutNote(e.target.value)} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={primaryBtn} onClick={runDispatchCloseout}>{tr("Close Dispatch Batch")}</button>
              <button style={secondaryBtn} onClick={openDispatchCloseoutPrint}>{tr("Print Closeout Summary")}</button>
            </div>

              {closeoutResult ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Metric label={tr("Dispatch Batch ID")} value={safe(closeoutResult.dispatch_batch_id)} strong />
                  <Metric label={tr("Status")} value={statusText(lang, closeoutResult.status)} />
                  <Metric label={tr("Delivered")} value={safe(closeoutResult.delivered_count)} />
                  <Metric label={tr("Failed Attempts")} value={safe(closeoutResult.failed_count)} />
                  <Metric label={tr("Returned")} value={safe(closeoutResult.returned_count)} />
                  <Metric label={tr("COD Expected")} value={money(closeoutResult.cod_expected)} />
                  <Metric label={tr("COD Collected")} value={money(closeoutResult.cod_collected)} />
                  <Metric label={tr("Shortage")} value={money(closeoutResult.shortage_amount)} />
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>{tr("No closeout result yet.")}</div>
              )}
            </>
          )}


          {tab === "history" && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Audit Trail")}</div>
              {!selectedWay ? (
                <div style={{ color: "#64748b" }}>{tr("Select a way from the queue to view its history.")}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 560, overflow: "auto" }}>
                  {historyRows.map((row: any) => (
                    <div key={row.id} style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 12, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{safe(row.action)}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{safe(row.created_at)}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                        {statusText(lang, row.from_status)} → {statusText(lang, row.to_status)}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                        {tr("Rider")}: {safe(row.rider_name)} {safe(row.rider_phone, "")}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                        {safe(row.note)}
                      </div>
                    </div>
                  ))}
                  {!historyRows.length && (
                    <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                      {tr("No audit logs.")}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ ...card, padding: 14, background: strong ? "linear-gradient(135deg,#ecfeff 0%,#f0fdf4 100%)" : "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{value}</div>
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
