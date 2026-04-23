// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePickups, useShipments } from "../hooks/useApi";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function contains(hay: any, needle: string) {
  return String(hay || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function fmt(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

export default function DataEntryOperationsDashboard() {
  const { lang, t: tr } = useT();
  const navigate = useNavigate();

  const pickupQuery = usePickups({ limit: "500" });
  const shipmentQuery = useShipments({ limit: "1000" });

  const [deliveredRows, setDeliveredRows] = useState<any[]>([]);
  const [consolidatedRows, setConsolidatedRows] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [tab, setTab] = useState<"draft" | "saved" | "submitted" | "delivered" | "consolidated">("draft");
  const [search, setSearch] = useState("");
  const [township, setTownship] = useState("");
  const [date, setDate] = useState("");

  const pickupRows = Array.isArray(pickupQuery.data) ? pickupQuery.data : pickupQuery.data?.data || [];
  const deliveryRows = Array.isArray(shipmentQuery.data) ? shipmentQuery.data : shipmentQuery.data?.data || [];

  useEffect(() => {
    let active = true;

    async function loadExtra() {
      setLoadingExtra(true);
      try {
        const [deliveredRes, consolidatedRes] = await Promise.all([
          fetch("/api/v1/delivered"),
          fetch("/api/v1/consolidations"),
        ]);

        const deliveredData = await deliveredRes.json();
        const consolidatedData = await consolidatedRes.json();

        if (!active) return;

        setDeliveredRows(Array.isArray(deliveredData?.data) ? deliveredData.data : []);
        setConsolidatedRows(Array.isArray(consolidatedData?.data) ? consolidatedData.data : []);
      } catch {
        if (!active) return;
        setDeliveredRows([]);
        setConsolidatedRows([]);
      } finally {
        if (active) setLoadingExtra(false);
      }
    }

    void loadExtra();
    return () => {
      active = false;
    };
  }, []);

  const pickupDrafts = useMemo(
    () => pickupRows.filter((r: any) => String(r?.pickup_status || r?.status || "").toUpperCase() === "DRAFT"),
    [pickupRows]
  );

  const pickupSaved = useMemo(
    () => pickupRows.filter((r: any) => String(r?.pickup_status || r?.status || "").toUpperCase() === "SAVED"),
    [pickupRows]
  );

  const pickupSubmitted = useMemo(
    () => pickupRows.filter((r: any) => String(r?.pickup_status || r?.status || "").toUpperCase() === "SUBMITTED"),
    [pickupRows]
  );

  const deliveredItems = useMemo(() => {
    return deliveredRows.flatMap((batch: any) =>
      Array.isArray(batch?.delivery_completion_items) ? batch.delivery_completion_items : []
    );
  }, [deliveredRows]);

  const consolidatedItems = useMemo(() => {
    return consolidatedRows.flatMap((batch: any) =>
      Array.isArray(batch?.daily_consolidation_pickups) ? batch.daily_consolidation_pickups.map((x: any) => ({
        ...x,
        consolidation_date: batch?.consolidation_date,
        consolidated_id: batch?.consolidated_id,
        hub_code: batch?.hub_code,
        route_code: batch?.route_code,
      })) : []
    );
  }, [consolidatedRows]);

  const currentRows = useMemo(() => {
    if (tab === "draft") return pickupDrafts;
    if (tab === "saved") return pickupSaved;
    if (tab === "submitted") return pickupSubmitted;
    if (tab === "delivered") return deliveredItems;
    return consolidatedItems;
  }, [tab, pickupDrafts, pickupSaved, pickupSubmitted, deliveredItems, consolidatedItems]);

  const filteredRows = useMemo(() => {
    return currentRows.filter((row: any) => {
      const merged = [
        row?.pickup_id,
        row?.delivery_id,
        row?.merchant_name,
        row?.sender_name,
        row?.receiver_name,
        row?.receiver_phone,
        row?.pickup_township,
        row?.receiver_township,
        row?.township,
        row?.consolidated_id,
      ].join(" ");

      const rowDate =
        String(row?.pickup_date || row?.delivery_date || row?.consolidation_date || row?.created_at || "");
      const rowTownship =
        String(row?.pickup_township || row?.receiver_township || row?.township || "");

      return (
        (!search || contains(merged, search)) &&
        (!township || contains(rowTownship, township)) &&
        (!date || rowDate.includes(date))
      );
    });
  }, [currentRows, search, township, date]);

  const kpis = {
    drafts: pickupDrafts.length,
    saved: pickupSaved.length,
    submitted: pickupSubmitted.length,
    delivered: deliveredItems.length,
    consolidated: consolidatedItems.length,
    totalPickups: pickupRows.length,
    totalDeliveries: deliveryRows.length,
  };

  return (
    <div className="deo-page">
      <style>{css}</style>

      <section className="deo-hero">
        <div>
          <div className="deo-chip">Enterprise Data Entry Operations</div>
          <h1>Data Entry Operations Dashboard</h1>
          <p>
            Unified dashboard for pickup drafts, saved queues, submitted work,
            delivered registrations, and daily consolidations.
          </p>
        </div>

        <div className="deo-actions">
          <button className="deo-btn primary" onClick={() => navigate("/create-delivery?source=DEO")}>
            New Data Entry Pickup
          </button>
          <button className="deo-btn secondary" onClick={() => navigate("/pickup-control-center")}>
            Pickup Control Center
          </button>
        </div>
      </section>

      <section className="deo-kpis">
        <Kpi title="Draft Queue" value={kpis.drafts} />
        <Kpi title="Saved Queue" value={kpis.saved} />
        <Kpi title="Submitted Queue" value={kpis.submitted} />
        <Kpi title="Delivered Queue" value={kpis.delivered} />
        <Kpi title="Consolidated Queue" value={kpis.consolidated} />
        <Kpi title="Total Pickups" value={kpis.totalPickups} />
        <Kpi title="Total Deliveries" value={kpis.totalDeliveries} />
      </section>

      <section className="deo-tabs">
        <button className={tab === "draft" ? "deo-tab active" : "deo-tab"} onClick={() => setTab("draft")}>
          Draft
        </button>
        <button className={tab === "saved" ? "deo-tab active" : "deo-tab"} onClick={() => setTab("saved")}>
          Saved
        </button>
        <button className={tab === "submitted" ? "deo-tab active" : "deo-tab"} onClick={() => setTab("submitted")}>
          Submitted
        </button>
        <button className={tab === "delivered" ? "deo-tab active" : "deo-tab"} onClick={() => setTab("delivered")}>
          Delivered
        </button>
        <button className={tab === "consolidated" ? "deo-tab active" : "deo-tab"} onClick={() => setTab("consolidated")}>
          Consolidated
        </button>
      </section>

      <section className="deo-card">
        <div className="deo-head">
          <div>
            <div className="deo-title">Queue Overview</div>
            <div className="deo-subtitle">
              Search and work through the selected queue.
            </div>
          </div>

          <div className="deo-inline-actions">
            <button className="deo-btn small" onClick={() => navigate("/delivered-registration")}>
              Delivered Registration
            </button>
            <button className="deo-btn small secondary" onClick={() => navigate("/daily-consolidation")}>
              Daily Consolidation
            </button>
            <button className="deo-btn small secondary" onClick={() => navigate("/pickup-delivery-overview")}>
              Pickup & Delivery Overview
            </button>
          </div>
        </div>

        <div className="deo-filters">
          <input
            placeholder={tr("Search pickup, delivery, merchant, receiver...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            placeholder={tr("Township")}
            value={township}
            onChange={(e) => setTownship(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="deo-table-wrap">
          <table className="deo-table">
            <thead>
              {tab === "draft" || tab === "saved" || tab === "submitted" ? (
                <tr>
                  <th>Pickup ID</th>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Township</th>
                  <th>Status</th>
                  <th>Ways</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              ) : tab === "delivered" ? (
                <tr>
                  <th>Delivered Reg ID</th>
                  <th>Pickup ID</th>
                  <th>Delivery ID</th>
                  <th>Receiver</th>
                  <th>Phone</th>
                  <th>Delivered At</th>
                  <th>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Consolidated ID</th>
                  <th>Date</th>
                  <th>Hub</th>
                  <th>Route</th>
                  <th>Pickup ID</th>
                  <th>Merchant</th>
                  <th>Ways</th>
                  <th>Actions</th>
                </tr>
              )}
            </thead>

            <tbody>
              {(tab === "draft" || tab === "saved" || tab === "submitted") &&
                filteredRows.map((row: any, idx: number) => {
                  const pickupId = row?.pickup_id || row?.pickup_way_id || row?.pickupId || `pickup-${idx}`;
                  return (
                    <tr key={pickupId}>
                      <td className="strong">{safe(pickupId)}</td>
                      <td>{safe(row?.pickup_date)}</td>
                      <td>{safe(row?.merchant_name || row?.sender_name)}</td>
                      <td>{safe(row?.pickup_township || row?.sender_township)}</td>
                      <td>{statusText(lang, row?.pickup_status || row?.status)}</td>
                      <td>{safe(row?.actual_way_count || row?.expected_way_count || row?.parcel_count || 0)}</td>
                      <td>{fmt(row?.updated_at || row?.created_at)}</td>
                      <td>
                        <div className="deo-inline">
                          <button
                            className="deo-btn small"
                            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(pickupId)}`)}
                          >
                            Open Pickup
                          </button>
                          <button
                            className="deo-btn small secondary"
                            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(pickupId)}&pane=delivery`)}
                          >
                            Open Delivery
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {tab === "delivered" &&
                filteredRows.map((row: any, idx: number) => (
                  <tr key={row?.id || idx}>
                    <td className="strong">{safe(row?.delivered_reg_id)}</td>
                    <td>{safe(row?.pickup_id)}</td>
                    <td>{safe(row?.delivery_id)}</td>
                    <td>{safe(row?.receiver_name)}</td>
                    <td>{safe(row?.receiver_phone)}</td>
                    <td>{fmt(row?.delivered_at)}</td>
                    <td>
                      <div className="deo-inline">
                        <button
                          className="deo-btn small"
                          onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(row?.pickup_id || "")}&pane=delivery&delivery_id=${encodeURIComponent(row?.delivery_id || "")}`)}
                        >
                          Open Parent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {tab === "consolidated" &&
                filteredRows.map((row: any, idx: number) => (
                  <tr key={row?.id || idx}>
                    <td className="strong">{safe(row?.consolidated_id)}</td>
                    <td>{safe(row?.consolidation_date)}</td>
                    <td>{safe(row?.hub_code)}</td>
                    <td>{safe(row?.route_code)}</td>
                    <td>{safe(row?.pickup_id)}</td>
                    <td>{safe(row?.merchant_name)}</td>
                    <td>{safe(row?.total_way_count)}</td>
                    <td>
                      <div className="deo-inline">
                        <button
                          className="deo-btn small"
                          onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(row?.pickup_id || "")}`)}
                        >
                          Open Pickup
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!filteredRows.length && (
                <tr>
                  <td colSpan={8} className="empty">
                    {loadingExtra ? "Loading..." : "No records found for this queue."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="deo-kpi">
      <div className="deo-kpi-label">{title}</div>
      <div className="deo-kpi-value">{value}</div>
    </div>
  );
}

const css = `
.deo-page{display:flex;flex-direction:column;gap:18px}
.deo-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid #dbe4ee;border-radius:24px;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);box-shadow:0 10px 24px rgba(15,23,42,.04);padding:24px}
.deo-chip{display:inline-flex;padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
.deo-hero h1{margin:14px 0 0;font-size:30px;font-weight:900;color:#0f172a}
.deo-hero p{margin:10px 0 0;color:#64748b;font-size:14px;line-height:1.7}
.deo-actions{display:flex;gap:10px;flex-wrap:wrap}
.deo-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px}
.deo-kpi{border:1px solid #dbe4ee;border-radius:18px;background:#fff;padding:14px;box-shadow:0 10px 24px rgba(15,23,42,.04)}
.deo-kpi-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b}
.deo-kpi-value{margin-top:10px;font-size:24px;font-weight:900;color:#0f172a}
.deo-tabs{display:flex;gap:8px;border:1px solid #dbe4ee;border-radius:22px;background:#fff;padding:8px;box-shadow:0 8px 20px rgba(15,23,42,.03)}
.deo-tab{flex:1;border:none;border-radius:16px;background:transparent;color:#475569;font-weight:800;padding:14px 18px;cursor:pointer}
.deo-tab.active{background:#0f2f5c;color:#fff}
.deo-card{border:1px solid #dbe4ee;border-radius:24px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.04);padding:20px}
.deo-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.deo-title{font-size:22px;font-weight:900;color:#0f172a}
.deo-subtitle{margin-top:4px;font-size:13px;color:#64748b}
.deo-inline-actions{display:flex;gap:8px;flex-wrap:wrap}
.deo-filters{display:grid;grid-template-columns:2fr 1fr 220px;gap:12px;margin-bottom:16px}
.deo-filters input{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font-size:14px;font-family:inherit}
.deo-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:18px}
.deo-table{width:100%;border-collapse:collapse;min-width:1100px}
.deo-table th{background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:14px 12px;border-bottom:1px solid #e2e8f0}
.deo-table td{padding:14px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-size:14px}
.deo-table .strong{font-weight:900;color:#0f172a}
.deo-inline{display:flex;gap:8px;flex-wrap:wrap}
.deo-btn{border:none;border-radius:14px;background:#0f766e;color:#fff;padding:12px 18px;font-size:14px;font-weight:800;cursor:pointer}
.deo-btn.small{padding:8px 12px;font-size:12px}
.deo-btn.secondary{background:#0f2f5c}
.empty{text-align:center;color:#64748b;padding:18px}
@media (max-width: 1280px){.deo-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width: 960px){.deo-hero{flex-direction:column}.deo-filters{grid-template-columns:1fr}.deo-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width: 640px){.deo-kpis{grid-template-columns:1fr}}
`;
