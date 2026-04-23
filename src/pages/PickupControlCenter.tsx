// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePickups } from "../hooks/useApi";
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
  return String(hay || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PickupControlCenter() {
  const { lang, t: tr } = useT();
  const navigate = useNavigate();
  const pickupQuery = usePickups({ limit: "500" });

  const [filters, setFilters] = useState({
    date: "",
    merchant: "",
    status: "",
    township: "",
  });

  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attachmentType, setAttachmentType] = useState("manifest");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const pickupRows = Array.isArray(pickupQuery.data) ? pickupQuery.data : pickupQuery.data?.data || [];

  const filtered = useMemo(() => {
    return pickupRows.filter((row: any) => {
      const pickupDate = String(row?.pickup_date || row?.created_at || "");
      const merchant = String(row?.merchant_name || row?.sender_name || "");
      const status = String(row?.pickup_status || row?.status || "");
      const township = String(row?.pickup_township || row?.sender_township || "");
      return (
        (!filters.date || pickupDate.includes(filters.date)) &&
        (!filters.merchant || contains(merchant, filters.merchant)) &&
        (!filters.status || contains(status, filters.status)) &&
        (!filters.township || contains(township, filters.township))
      );
    });
  }, [pickupRows, filters]);

  useEffect(() => {
    if (!selectedPickupId && filtered.length) {
      setSelectedPickupId(String(filtered[0]?.pickup_id || filtered[0]?.pickup_way_id || ""));
    }
  }, [filtered, selectedPickupId]);

  useEffect(() => {
    if (!selectedPickupId) return;
    let active = true;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/v1/pickups?pickup_id=${encodeURIComponent(selectedPickupId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load pickup detail");
        if (!active) return;
        setDetail(data);
      } catch (error: any) {
        if (!active) return;
        setMessage(error?.message || "Failed to load pickup detail");
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [selectedPickupId]);

  async function uploadAttachment() {
    if (!selectedPickupId || !attachmentFile) return;
    setMessage("");

    try {
      const fileBase64 = await fileToBase64(attachmentFile);

      const res = await fetch("/api/v1/pickup-attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_id: selectedPickupId,
          attachment_type: attachmentType,
          file_name: attachmentFile.name,
          mime_type: attachmentFile.type || "application/octet-stream",
          file_base64: fileBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to upload attachment");

      setMessage(`Attachment uploaded: ${data.data.file_name}`);
      setAttachmentFile(null);

      const reload = await fetch(`/api/v1/pickups?pickup_id=${encodeURIComponent(selectedPickupId)}`);
      const reloadData = await reload.json();
      if (reload.ok) setDetail(reloadData);
    } catch (error: any) {
      setMessage(error?.message || "Failed to upload attachment");
    }
  }

  const pickup = detail?.pickup || {};
  const deliveries = Array.isArray(detail?.deliveries) ? detail.deliveries : [];
  const audits = Array.isArray(detail?.audit_logs) ? detail.audit_logs : [];
  const histories = Array.isArray(detail?.status_history) ? detail.status_history : [];
  const attachments = Array.isArray(detail?.attachments) ? detail.attachments : [];

  return (
    <div className="pcc-page">
      <style>{css}</style>

      <section className="pcc-hero">
        <div>
          <div className="pcc-chip">Enterprise Pickup Control Center</div>
          <h1>Pickup Operations, Audit, Status, and Attachments</h1>
          <p>
            Review pickup master data, delivery child rows, audit logs, status
            history, and attachments in one control center.
          </p>
        </div>

        <div className="pcc-actions">
          <button className="pcc-btn primary" onClick={() => navigate("/create-delivery")}>
            New Pickup
          </button>
          <button
            className="pcc-btn secondary"
            disabled={!selectedPickupId}
            onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(selectedPickupId)}`)}
          >
            Open Pickup
          </button>
        </div>
      </section>

      {message ? <div className="pcc-alert">{message}</div> : null}

      <div className="pcc-layout">
        <section className="pcc-card">
          <div className="pcc-card-head">
            <div>
              <div className="pcc-title">Pickup List</div>
              <div className="pcc-subtitle">Filter and open a pickup master record.</div>
            </div>
            <div className="pcc-count">{filtered.length} pickup(s)</div>
          </div>

          <div className="pcc-filters">
            <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
            <input placeholder="Merchant" value={filters.merchant} onChange={(e) => setFilters({ ...filters, merchant: e.target.value })} />
            <input placeholder="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} />
            <input placeholder="Township" value={filters.township} onChange={(e) => setFilters({ ...filters, township: e.target.value })} />
          </div>

          <div className="pcc-list">
            {filtered.map((row: any, idx: number) => {
              const pickupId = String(row?.pickup_id || row?.pickup_way_id || row?.pickupId || `pickup-${idx}`);
              const active = pickupId === selectedPickupId;
              return (
                <button
                  key={pickupId}
                  className={active ? "pcc-list-item active" : "pcc-list-item"}
                  onClick={() => setSelectedPickupId(pickupId)}
                >
                  <div className="top">
                    <strong>{pickupId}</strong>
                    <span>{statusText(lang, row?.pickup_status || row?.status)}</span>
                  </div>
                  <div>{safe(row?.merchant_name || row?.sender_name)}</div>
                  <div className="muted">
                    {safe(row?.pickup_township || row?.sender_township)} · {safe(row?.actual_way_count || row?.expected_way_count || row?.parcel_count || 0)} ways
                  </div>
                </button>
              );
            })}
            {!filtered.length && <div className="pcc-empty">No pickups found.</div>}
          </div>
        </section>

        <section className="pcc-main">
          <section className="pcc-card">
            <div className="pcc-card-head">
              <div>
                <div className="pcc-title">Pickup Summary</div>
                <div className="pcc-subtitle">Master record and quick actions.</div>
              </div>
              <div className="pcc-inline">
                <button
                  className="pcc-btn small"
                  disabled={!selectedPickupId}
                  onClick={() => navigate(`/create-delivery?pickup_id=${encodeURIComponent(selectedPickupId)}&pane=delivery`)}
                >
                  Open Delivery Pane
                </button>
                <button
                  className="pcc-btn small secondary"
                  disabled={!selectedPickupId}
                  onClick={() => navigate("/delivered-registration")}
                >
                  Delivered Registration
                </button>
                <button
                  className="pcc-btn small secondary"
                  disabled={!selectedPickupId}
                  onClick={() => navigate("/daily-consolidation")}
                >
                  Daily Consolidation
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="pcc-empty">Loading pickup...</div>
            ) : (
              <div className="pcc-grid3">
                <Metric label="Pickup ID" value={safe(pickup?.pickup_id)} strong />
                <Metric label="Merchant" value={safe(pickup?.merchant_name)} />
                <Metric label="Status" value={statusText(lang, pickup?.pickup_status)} />
                <Metric label="Pickup Date" value={safe(pickup?.pickup_date)} />
                <Metric label="Expected Ways" value={safe(pickup?.expected_way_count || 0)} />
                <Metric label="Actual Ways" value={safe(pickup?.actual_way_count || deliveries.length || 0)} />
              </div>
            )}
          </section>

          <section className="pcc-card">
            <div className="pcc-card-head">
              <div>
                <div className="pcc-title">Delivery Child Rows</div>
                <div className="pcc-subtitle">All delivery IDs under the selected pickup.</div>
              </div>
              <div className="pcc-count">{deliveries.length} row(s)</div>
            </div>

            <div className="pcc-table-wrap">
              <table className="pcc-table">
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Receiver</th>
                    <th>Phone</th>
                    <th>Township</th>
                    <th>Status</th>
                    <th>Receivable</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((row: any, idx: number) => (
                    <tr key={row?.delivery_id || idx}>
                      <td className="strong">{safe(row?.delivery_id)}</td>
                      <td>{safe(row?.receiver_name)}</td>
                      <td>{safe(row?.receiver_phone)}</td>
                      <td>{safe(row?.receiver_township || row?.township)}</td>
                      <td>{safe(row?.delivery_status || row?.detail_status || row?.status)}</td>
                      <td>{safe(row?.receivable)}</td>
                    </tr>
                  ))}
                  {!deliveries.length && (
                    <tr>
                      <td colSpan={6} className="pcc-empty-cell">No delivery rows found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="pcc-split">
            <section className="pcc-card">
              <div className="pcc-card-head">
                <div>
                  <div className="pcc-title">Pickup Audit Log</div>
                  <div className="pcc-subtitle">Creation, save, submit, and attachment events.</div>
                </div>
              </div>
              <div className="pcc-log-list">
                {audits.map((row: any, idx: number) => (
                  <div key={row?.id || idx} className="pcc-log-item">
                    <strong>{safe(row?.action)}</strong>
                    <div>{fmtDate(row?.created_at)}</div>
                  </div>
                ))}
                {!audits.length && <div className="pcc-empty">No audit logs.</div>}
              </div>
            </section>

            <section className="pcc-card">
              <div className="pcc-card-head">
                <div>
                  <div className="pcc-title">Status History</div>
                  <div className="pcc-subtitle">Lifecycle transitions for this pickup.</div>
                </div>
              </div>
              <div className="pcc-log-list">
                {histories.map((row: any, idx: number) => (
                  <div key={row?.id || idx} className="pcc-log-item">
                    <strong>{safe(row?.from_status, "NEW")} → {safe(row?.to_status)}</strong>
                    <div>{fmtDate(row?.changed_at)}</div>
                  </div>
                ))}
                {!histories.length && <div className="pcc-empty">No status history.</div>}
              </div>
            </section>
          </div>

          <section className="pcc-card">
            <div className="pcc-card-head">
              <div>
                <div className="pcc-title">Pickup Attachments</div>
                <div className="pcc-subtitle">Manifest, handover photo, signed form, or carton photo.</div>
              </div>
            </div>

            <div className="pcc-upload">
              <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}>
                <option value="manifest">Manifest</option>
                <option value="handover_photo">Handover Photo</option>
                <option value="signed_form">Signed Form</option>
                <option value="carton_photo">Carton Photo</option>
              </select>
              <input type="file" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
              <button className="pcc-btn primary" disabled={!selectedPickupId || !attachmentFile} onClick={uploadAttachment}>
                Upload Attachment
              </button>
            </div>

            <div className="pcc-attachment-list">
              {attachments.map((row: any, idx: number) => (
                <a key={row?.id || idx} className="pcc-attachment" href={row?.file_url} target="_blank" rel="noreferrer">
                  <strong>{safe(row?.attachment_type)}</strong>
                  <span>{safe(row?.file_name)}</span>
                </a>
              ))}
              {!attachments.length && <div className="pcc-empty">No attachments uploaded.</div>}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "pcc-metric strong" : "pcc-metric"}>
      <div className="pcc-metric-label">{label}</div>
      <div className="pcc-metric-value">{value}</div>
    </div>
  );
}

const css = `
.pcc-page{display:flex;flex-direction:column;gap:18px}
.pcc-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid #dbe4ee;border-radius:24px;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);box-shadow:0 10px 24px rgba(15,23,42,.04);padding:24px}
.pcc-chip{display:inline-flex;padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
.pcc-hero h1{margin:14px 0 0;font-size:30px;font-weight:900;color:#0f172a}
.pcc-hero p{margin:10px 0 0;color:#64748b;font-size:14px;line-height:1.7}
.pcc-actions{display:flex;gap:10px;flex-wrap:wrap}
.pcc-layout{display:grid;grid-template-columns:360px minmax(0,1fr);gap:18px}
.pcc-main{display:flex;flex-direction:column;gap:18px}
.pcc-card{border:1px solid #dbe4ee;border-radius:24px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.04);padding:20px}
.pcc-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.pcc-title{font-size:22px;font-weight:900;color:#0f172a}
.pcc-subtitle{margin-top:4px;font-size:13px;color:#64748b}
.pcc-count{border:1px solid #dbe4ee;border-radius:14px;background:#f8fafc;padding:10px 14px;font-size:12px;font-weight:800;color:#334155}
.pcc-filters{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px}
.pcc-filters input,.pcc-upload select,.pcc-upload input{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font-size:14px;font-family:inherit}
.pcc-list{display:flex;flex-direction:column;gap:10px;max-height:720px;overflow:auto}
.pcc-list-item{width:100%;text-align:left;border:1px solid #dbe4ee;border-radius:18px;background:#fff;padding:14px;cursor:pointer;transition:all .2s ease}
.pcc-list-item:hover,.pcc-list-item.active{background:#eff6ff;border-color:#93c5fd}
.pcc-list-item .top{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}
.pcc-list-item strong{font-size:14px;color:#0f172a}
.pcc-list-item span{font-size:11px;font-weight:800;color:#475569;text-transform:uppercase}
.pcc-list-item .muted{margin-top:6px;color:#64748b;font-size:12px}
.pcc-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.pcc-metric{border:1px solid #dbe4ee;border-radius:18px;background:#fff;padding:14px}
.pcc-metric.strong{background:linear-gradient(135deg,#ecfeff 0%,#f0fdf4 100%)}
.pcc-metric-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b}
.pcc-metric-value{margin-top:10px;font-size:18px;font-weight:900;color:#0f172a}
.pcc-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:18px}
.pcc-table{width:100%;border-collapse:collapse;min-width:860px}
.pcc-table th{background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:14px 12px;border-bottom:1px solid #e2e8f0}
.pcc-table td{padding:14px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-size:14px}
.pcc-table .strong{font-weight:900;color:#0f172a}
.pcc-split{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.pcc-log-list{display:flex;flex-direction:column;gap:10px}
.pcc-log-item{border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:12px 14px}
.pcc-log-item strong{display:block;color:#0f172a}
.pcc-log-item div{margin-top:4px;color:#64748b;font-size:12px}
.pcc-upload{display:grid;grid-template-columns:180px 1fr 180px;gap:12px;margin-bottom:16px}
.pcc-attachment-list{display:flex;flex-direction:column;gap:10px}
.pcc-attachment{display:flex;justify-content:space-between;gap:12px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:12px 14px;text-decoration:none;color:#0f172a}
.pcc-attachment span{color:#64748b}
.pcc-inline{display:flex;gap:8px;flex-wrap:wrap}
.pcc-btn{border:none;border-radius:14px;background:#0f766e;color:#fff;padding:12px 18px;font-size:14px;font-weight:800;cursor:pointer}
.pcc-btn.small{padding:8px 12px;font-size:12px}
.pcc-btn.secondary{background:#0f2f5c}
.pcc-alert{border:1px solid #a5f3fc;background:#ecfeff;color:#0f766e;padding:12px 14px;border-radius:16px;font-size:13px;font-weight:700}
.pcc-empty,.pcc-empty-cell{text-align:center;color:#64748b;padding:18px}
@media (max-width: 1180px){.pcc-layout{grid-template-columns:1fr}.pcc-grid3,.pcc-split{grid-template-columns:1fr}.pcc-upload{grid-template-columns:1fr}}

`;
