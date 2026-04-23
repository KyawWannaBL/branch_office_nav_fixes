// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePickups, useShipments } from "../hooks/useApi";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function fmtDate(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function contains(hay: any, needle: string) {
  return String(hay || "").toLowerCase().includes(needle.toLowerCase());
}

export default function PickupDeliveryOverview() {
  const { lang, t: tr } = useT();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pickups" | "deliveries">("pickups");

  const [pickupFilters, setPickupFilters] = useState({
    date: "",
    merchant: "",
    status: "",
    township: "",
  });

  const [deliveryFilters, setDeliveryFilters] = useState({
    date: "",
    merchant: "",
    status: "",
    township: "",
  });

  const pickupQuery = usePickups({ limit: "500" });
  const shipmentQuery = useShipments({ limit: "1000" });

  const pickupRows = Array.isArray(pickupQuery.data) ? pickupQuery.data : pickupQuery.data?.data || [];
  const deliveryRows = Array.isArray(shipmentQuery.data) ? shipmentQuery.data : shipmentQuery.data?.data || [];

  const filteredPickups = useMemo(() => {
    return pickupRows.filter((row: any) => {
      const pickupDate = String(row?.pickup_date || row?.created_at || "");
      const merchant = String(row?.merchant_name || row?.sender_name || "");
      const status = String(row?.pickup_status || row?.status || "");
      const township = String(row?.pickup_township || row?.sender_township || "");

      return (
        (!pickupFilters.date || pickupDate.includes(pickupFilters.date)) &&
        (!pickupFilters.merchant || contains(merchant, pickupFilters.merchant)) &&
        (!pickupFilters.status || contains(status, pickupFilters.status)) &&
        (!pickupFilters.township || contains(township, pickupFilters.township))
      );
    });
  }, [pickupRows, pickupFilters]);

  const filteredDeliveries = useMemo(() => {
    return deliveryRows.filter((row: any) => {
      const date = String(row?.created_at || row?.pickup_date || "");
      const merchant = String(row?.merchant_name || row?.sender_name || "");
      const status = String(row?.delivery_status || row?.status || "");
      const township = String(
        row?.receiver_township || row?.township || row?.pickup_township || ""
      );

      return (
        (!deliveryFilters.date || date.includes(deliveryFilters.date)) &&
        (!deliveryFilters.merchant || contains(merchant, deliveryFilters.merchant)) &&
        (!deliveryFilters.status || contains(status, deliveryFilters.status)) &&
        (!deliveryFilters.township || contains(township, deliveryFilters.township))
      );
    });
  }, [deliveryRows, deliveryFilters]);

  return (
    <div className="ov-page">
      <style>{css}</style>

      <section className="ov-hero">
        <div>
          <div className="ov-chip">Enterprise Overview</div>
          <h1>Pickup and Delivery Data Entry Overview</h1>
          <p>
            Use this board to filter, review, and open Pickup master records and
            child Delivery records with master/child hierarchy.
          </p>
        </div>

        <div className="ov-actions">
          <button className="ov-btn primary" onClick={() => navigate("/create-delivery")}>
            New Pickup
          </button>
        </div>
      </section>

      <section className="ov-tabs">
        <button
          className={tab === "pickups" ? "ov-tab active" : "ov-tab"}
          onClick={() => setTab("pickups")}
        >
          Pickup List Overview
        </button>
        <button
          className={tab === "deliveries" ? "ov-tab active" : "ov-tab"}
          onClick={() => setTab("deliveries")}
        >
          Delivery List Overview
        </button>
      </section>

      {tab === "pickups" && (
        <section className="ov-card">
          <div className="ov-head">
            <div>
              <div className="ov-title">Pickup Master List</div>
              <div className="ov-subtitle">
                Each Pickup ID can contain many Delivery IDs.
              </div>
            </div>
            <div className="ov-count">{filteredPickups.length} pickup(s)</div>
          </div>

          <div className="ov-filters">
            <input
              type="date"
              value={pickupFilters.date}
              onChange={(e) => setPickupFilters({ ...pickupFilters, date: e.target.value })}
            />
            <input
              placeholder="Merchant / Sender"
              value={pickupFilters.merchant}
              onChange={(e) => setPickupFilters({ ...pickupFilters, merchant: e.target.value })}
            />
            <input
              placeholder="Status"
              value={pickupFilters.status}
              onChange={(e) => setPickupFilters({ ...pickupFilters, status: e.target.value })}
            />
            <input
              placeholder="Township"
              value={pickupFilters.township}
              onChange={(e) => setPickupFilters({ ...pickupFilters, township: e.target.value })}
            />
          </div>

          <div className="ov-table-wrap">
            <table className="ov-table">
              <thead>
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
              </thead>
              <tbody>
                {filteredPickups.map((row: any, idx: number) => {
                  const pickupId = row?.pickup_id || row?.pickup_way_id || row?.pickupId || `pickup-${idx}`;
                  return (
                    <tr key={pickupId}>
                      <td className="strong">{safe(pickupId)}</td>
                      <td>{safe(row?.pickup_date)}</td>
                      <td>{safe(row?.merchant_name || row?.sender_name)}</td>
                      <td>{safe(row?.pickup_township || row?.sender_township)}</td>
                      <td>{statusText(lang, row?.pickup_status || row?.status)}</td>
                      <td>{safe(row?.actual_way_count || row?.expected_way_count || row?.parcel_count || 0)}</td>
                      <td>{fmtDate(row?.updated_at || row?.created_at)}</td>
                      <td>
                        <div className="ov-inline">
                          <button
                            className="ov-btn small"
                            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(pickupId)}`)}
                          >
                            Open Pickup
                          </button>
                          <button
                            className="ov-btn small secondary"
                            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(pickupId)}&pane=delivery`)}
                          >
                            Open Delivery
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredPickups.length && (
                  <tr>
                    <td colSpan={8} className="empty">No pickup records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "deliveries" && (
        <section className="ov-card">
          <div className="ov-head">
            <div>
              <div className="ov-title">Delivery Child List</div>
              <div className="ov-subtitle">
                Detail rows under Pickup master records.
              </div>
            </div>
            <div className="ov-count">{filteredDeliveries.length} delivery row(s)</div>
          </div>

          <div className="ov-filters">
            <input
              type="date"
              value={deliveryFilters.date}
              onChange={(e) => setDeliveryFilters({ ...deliveryFilters, date: e.target.value })}
            />
            <input
              placeholder="Merchant / Sender"
              value={deliveryFilters.merchant}
              onChange={(e) => setDeliveryFilters({ ...deliveryFilters, merchant: e.target.value })}
            />
            <input
              placeholder="Status"
              value={deliveryFilters.status}
              onChange={(e) => setDeliveryFilters({ ...deliveryFilters, status: e.target.value })}
            />
            <input
              placeholder="Township"
              value={deliveryFilters.township}
              onChange={(e) => setDeliveryFilters({ ...deliveryFilters, township: e.target.value })}
            />
          </div>

          <div className="ov-table-wrap">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Pickup ID</th>
                  <th>Receiver</th>
                  <th>Phone</th>
                  <th>Township</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((row: any, idx: number) => {
                  const deliveryId = row?.delivery_id || row?.shipment_id || row?.tracking_no || `delivery-${idx}`;
                  const pickupId = row?.pickup_id || row?.pickup_way_id || "-";

                  return (
                    <tr key={deliveryId}>
                      <td className="strong">{safe(deliveryId)}</td>
                      <td>{safe(pickupId)}</td>
                      <td>{safe(row?.receiver_name)}</td>
                      <td>{safe(row?.receiver_phone)}</td>
                      <td>{safe(row?.receiver_township || row?.township)}</td>
                      <td>{statusText(lang, row?.delivery_status || row?.status)}</td>
                      <td>{fmtDate(row?.created_at)}</td>
                      <td>
                        <div className="ov-inline">
                          <button
                            className="ov-btn small"
                            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(pickupId)}&pane=delivery&delivery_id=${encodeURIComponent(deliveryId)}`)}
                          >
                            Open Parent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredDeliveries.length && (
                  <tr>
                    <td colSpan={8} className="empty">No delivery records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

const css = `
.ov-page{
  display:flex;
  flex-direction:column;
  gap:18px;
}
.ov-hero{
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:flex-start;
  border:1px solid #dbe4ee;
  border-radius:24px;
  background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);
  box-shadow:0 10px 24px rgba(15,23,42,.04);
  padding:24px;
}
.ov-chip{
  display:inline-flex;
  padding:8px 12px;
  border-radius:999px;
  background:#eff6ff;
  color:#1d4ed8;
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.12em;
}
.ov-hero h1{
  margin:14px 0 0;
  font-size:32px;
  font-weight:900;
  color:#0f172a;
}
.ov-hero p{
  margin:10px 0 0;
  color:#64748b;
  font-size:14px;
  line-height:1.7;
}
.ov-actions{
  display:flex;
  gap:10px;
}
.ov-tabs{
  display:flex;
  gap:8px;
  border:1px solid #dbe4ee;
  border-radius:22px;
  background:#fff;
  padding:8px;
  box-shadow:0 8px 20px rgba(15,23,42,.03);
}
.ov-tab{
  flex:1;
  border:none;
  border-radius:16px;
  background:transparent;
  color:#475569;
  font-weight:800;
  padding:14px 18px;
  cursor:pointer;
}
.ov-tab.active{
  background:#0f2f5c;
  color:#fff;
}
.ov-card{
  border:1px solid #dbe4ee;
  border-radius:24px;
  background:#fff;
  box-shadow:0 10px 24px rgba(15,23,42,.04);
  padding:20px;
}
.ov-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  margin-bottom:16px;
}
.ov-title{
  font-size:22px;
  font-weight:900;
  color:#0f172a;
}
.ov-subtitle{
  margin-top:4px;
  font-size:13px;
  color:#64748b;
}
.ov-count{
  border:1px solid #dbe4ee;
  border-radius:14px;
  background:#f8fafc;
  padding:10px 14px;
  font-size:12px;
  font-weight:800;
  color:#334155;
}
.ov-filters{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
  margin-bottom:16px;
}
.ov-filters input{
  width:100%;
  border:1px solid #cbd5e1;
  border-radius:14px;
  padding:12px 14px;
  font-size:14px;
  font-family:inherit;
}
.ov-table-wrap{
  overflow:auto;
  border:1px solid #e2e8f0;
  border-radius:18px;
}
.ov-table{
  width:100%;
  border-collapse:collapse;
  min-width:980px;
}
.ov-table th{
  background:#f8fafc;
  color:#64748b;
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.08em;
  text-align:left;
  padding:14px 12px;
  border-bottom:1px solid #e2e8f0;
}
.ov-table td{
  padding:14px 12px;
  border-bottom:1px solid #eef2f7;
  color:#334155;
  font-size:14px;
}
.ov-table .strong{
  font-weight:900;
  color:#0f172a;
}
.ov-inline{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.ov-btn{
  border:none;
  border-radius:14px;
  background:#0f766e;
  color:#fff;
  padding:12px 18px;
  font-size:14px;
  font-weight:800;
  cursor:pointer;
}
.ov-btn.small{
  padding:8px 12px;
  font-size:12px;
}
.ov-btn.secondary{
  background:#0f2f5c;
}
.empty{
  text-align:center;
  color:#64748b;
}
@media (max-width: 1100px){
  .ov-filters{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
@media (max-width: 760px){
  .ov-hero{
    flex-direction:column;
  }
  .ov-filters{
    grid-template-columns:1fr;
  }
}
`;
