// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";

const emptyForm = {
  id: "",
  service_type: "standard",
  township: "",
  base_weight_kg: "3",
  base_delivery_fee: "4000",
  overweight_per_kg: "2500",
  notes: "",
  active: true,
};

const serviceOptions = ["standard", "same_day", "next_day", "scheduled", "express", "cod_express"];

export default function TariffMaster() {
  const { lang, t: tr } = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [townshipFilter, setTownshipFilter] = useState("");
  const [form, setForm] = useState<any>(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (serviceFilter) qs.set("service_type", serviceFilter);
      if (townshipFilter) qs.set("township", townshipFilter);

      const res = await fetch(`/api/v1/master/tariffs?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load tariffs");
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load tariffs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setMessage("");
    const method = form.id ? "PATCH" : "POST";

    const res = await fetch("/api/v1/master/tariffs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        base_weight_kg: Number(form.base_weight_kg || 0),
        base_delivery_fee: Number(form.base_delivery_fee || 0),
        overweight_per_kg: Number(form.overweight_per_kg || 0),
      }),
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data?.error || "Failed to save tariff");

    setMessage(form.id ? "Tariff updated." : "Tariff created.");
    setForm(emptyForm);
    await load();
  }

  function editRow(row: any) {
    setForm({
      id: row.id || "",
      service_type: row.service_type || "standard",
      township: row.township || "",
      base_weight_kg: String(row.base_weight_kg ?? 0),
      base_delivery_fee: String(row.base_delivery_fee ?? 0),
      overweight_per_kg: String(row.overweight_per_kg ?? 0),
      notes: row.notes || "",
      active: row.active !== false,
    });
  }

  return (
    <div className="tm-page">
      <style>{css}</style>

      <section className="tm-hero">
        <div>
          <div className="tm-chip">Admin Master Data</div>
          <h1>Tariff Master</h1>
          <p>Manage service type pricing, township-specific overrides, base weight, and overweight surcharge rates.</p>
        </div>
      </section>

      {message ? <div className="tm-alert">{message}</div> : null}

      <div className="tm-layout">
        <section className="tm-card">
          <div className="tm-title">Tariff Form</div>
          <div className="tm-grid">
            <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <input placeholder="Township (blank = default)" value={form.township} onChange={(e) => setForm({ ...form, township: e.target.value })} />
            <input placeholder={tr("Base Weight (kg)")} value={form.base_weight_kg} onChange={(e) => setForm({ ...form, base_weight_kg: e.target.value })} />
            <input placeholder={tr("Base Delivery Fee")} value={form.base_delivery_fee} onChange={(e) => setForm({ ...form, base_delivery_fee: e.target.value })} />
            <input placeholder={tr("Overweight Per Kg")} value={form.overweight_per_kg} onChange={(e) => setForm({ ...form, overweight_per_kg: e.target.value })} />
            <select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <textarea className="wide" placeholder={tr("Notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="tm-actions">
            <button className="tm-btn secondary" onClick={() => setForm(emptyForm)}>{tr("Reset")}</button>
            <button className="tm-btn primary" onClick={save}>{form.id ? "Update Tariff" : "Create Tariff"}</button>
          </div>
        </section>

        <section className="tm-card">
          <div className="tm-head">
            <div className="tm-title">Tariff List</div>
            <div className="tm-inline">
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                <option value="">All Services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
              <input placeholder={tr("Township")} value={townshipFilter} onChange={(e) => setTownshipFilter(e.target.value)} />
              <button className="tm-btn primary" onClick={load}>{tr("Search")}</button>
            </div>
          </div>

          <div className="tm-table-wrap">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Township</th>
                  <th>Base Weight</th>
                  <th>Base Fee</th>
                  <th>Overweight / Kg</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="strong">{row.service_type}</td>
                    <td>{row.township || "Default"}</td>
                    <td>{row.base_weight_kg}</td>
                    <td>{row.base_delivery_fee}</td>
                    <td>{row.overweight_per_kg}</td>
                    <td>{row.active ? "Active" : "Inactive"}</td>
                    <td><button className="tm-btn small secondary" onClick={() => editRow(row)}>{tr("Edit")}</button></td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="empty">{loading ? "Loading..." : "No tariff records found."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

const css = `
.tm-page{display:flex;flex-direction:column;gap:18px}
.tm-hero{border:1px solid #dbe4ee;border-radius:24px;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);padding:24px;box-shadow:0 10px 24px rgba(15,23,42,.04)}
.tm-chip{display:inline-flex;padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
.tm-hero h1{margin:14px 0 0;font-size:30px;font-weight:900;color:#0f172a}
.tm-hero p{margin:10px 0 0;color:#64748b;font-size:14px;line-height:1.7}
.tm-alert{border:1px solid #a5f3fc;background:#ecfeff;color:#0f766e;padding:12px 14px;border-radius:16px;font-size:13px;font-weight:700}
.tm-layout{display:grid;grid-template-columns:420px minmax(0,1fr);gap:18px}
.tm-card{border:1px solid #dbe4ee;border-radius:24px;background:#fff;padding:20px;box-shadow:0 10px 24px rgba(15,23,42,.04)}
.tm-title{font-size:22px;font-weight:900;color:#0f172a}
.tm-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px}
.tm-inline{display:flex;gap:8px;flex-wrap:wrap}
.tm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
.tm-grid input,.tm-grid select,.tm-grid textarea,.tm-inline input,.tm-inline select{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font-size:14px;font-family:inherit}
.tm-grid .wide{grid-column:1 / -1;min-height:100px}
.tm-actions{display:flex;gap:10px;margin-top:16px}
.tm-btn{border:none;border-radius:14px;padding:12px 18px;font-size:14px;font-weight:800;cursor:pointer}
.tm-btn.primary{background:#0f766e;color:#fff}
.tm-btn.secondary{background:#0f2f5c;color:#fff}
.tm-btn.small{padding:8px 12px;font-size:12px}
.tm-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:18px}
.tm-table{width:100%;border-collapse:collapse;min-width:780px}
.tm-table th{background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:14px 12px;border-bottom:1px solid #e2e8f0}
.tm-table td{padding:14px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-size:14px}
.tm-table .strong{font-weight:900;color:#0f172a}
.empty{text-align:center;color:#64748b;padding:18px}
@media (max-width: 1100px){.tm-layout{grid-template-columns:1fr}}
`;
