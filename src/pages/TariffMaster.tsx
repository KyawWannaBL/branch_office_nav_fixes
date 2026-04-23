import { readApiJson } from "@/lib/readApiJson";
import React, { useEffect, useMemo, useState } from "react";
import { useT } from "@/hooks/useT";
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

const mutedBtn: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#fff",
  color: "#0f172a",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #dbe4ee",
  fontWeight: 800,
  color: "#334155",
  background: "#f8fafc",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  verticalAlign: "top",
};

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

export default function TariffMaster() {
  const { lang, t: tr } = useT();

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: "",
    township_name: "",
    base_price: "",
    weight_surcharge_per_kg: "0",
  });

  async function loadData() {
    setMessage("");
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("q", search.trim());

    const res = await fetch("/api/...");
    const data = await readApiJson(res);
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (error: any) {
      setRows([]);
      setMessage(error?.message || "Failed to load");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      township_name: "",
      base_price: "",
      weight_surcharge_per_kg: "0",
    });
  }

  function editRow(row: any) {
    setForm({
      id: String(row.id || ""),
      township_name: String(row.township_name || ""),
      base_price: String(row.base_price ?? ""),
      weight_surcharge_per_kg: String(row.weight_surcharge_per_kg ?? 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveForm() {
    setMessage("");

    const township_name = form.township_name.trim();
    const base_price = Number(form.base_price);
    const weight_surcharge_per_kg = Number(form.weight_surcharge_per_kg);

    if (!township_name) {
      setMessage("Township Name is required");
      return;
    }
    if (!Number.isFinite(base_price)) {
      setMessage("Base Price must be numeric");
      return;
    }
    if (!Number.isFinite(weight_surcharge_per_kg)) {
      setMessage("Weight Surcharge / Kg must be numeric");
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/v1/master/tariffs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          township_name,
          base_price,
          weight_surcharge_per_kg,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      setMessage(form.id ? "Tariff updated." : "Tariff created.");
      resetForm();
      await loadData();
    } catch (error: any) {
      setMessage(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const totalRows = useMemo(() => rows.length, [rows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={card}>
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
          {tr("Tariff Master")}
        </div>
        <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
          {tr("Tariff Master")}
        </h1>
        <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
          {tr("Manage township tariff base prices and weight surcharge values.")}
        </p>
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
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <div>
          <div style={labelStyle}>{tr("Township Name")}</div>
          <input
            style={inputStyle}
            value={form.township_name}
            onChange={(e) => setForm((s) => ({ ...s, township_name: e.target.value }))}
            placeholder={tr("Township Name")}
          />
        </div>

        <div>
          <div style={labelStyle}>{tr("Base Price")}</div>
          <input
            style={inputStyle}
            value={form.base_price}
            onChange={(e) => setForm((s) => ({ ...s, base_price: e.target.value }))}
            placeholder={tr("Base Price")}
            inputMode="decimal"
          />
        </div>

        <div>
          <div style={labelStyle}>{tr("Weight Surcharge / Kg")}</div>
          <input
            style={inputStyle}
            value={form.weight_surcharge_per_kg}
            onChange={(e) => setForm((s) => ({ ...s, weight_surcharge_per_kg: e.target.value }))}
            placeholder={tr("Weight Surcharge / Kg")}
            inputMode="decimal"
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", gridColumn: "1 / -1" }}>
          <button style={primaryBtn} onClick={saveForm} disabled={saving}>
            {form.id ? tr("Update Tariff") : tr("Create Tariff")}
          </button>
          <button style={mutedBtn} onClick={resetForm} type="button">
            {tr("Reset")}
          </button>
        </div>
      </section>

      <section style={{ ...card, display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <div style={{ minWidth: 260, flex: 1 }}>
          <div style={labelStyle}>{tr("Search")}</div>
          <input
            style={inputStyle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Search")}
          />
        </div>

        <button style={secondaryBtn} onClick={loadData}>
          {tr("Apply")}
        </button>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b" }}>
            {tr("Tariff List")}
          </div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
            {totalRows}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b" }}>
            {tr("Table Source")}
          </div>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            public.tariffs
          </div>
          <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>
            township_name · base_price · weight_surcharge_per_kg
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>
          {tr("Tariff List")}
        </div>

        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>{tr("Township Name")}</th>
                <th style={th}>{tr("Base Price")}</th>
                <th style={th}>{tr("Weight Surcharge / Kg")}</th>
                <th style={th}>{tr("Updated At")}</th>
                <th style={th}>{tr("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td style={td}>{safe(row.township_name)}</td>
                  <td style={td}>{safe(row.base_price)}</td>
                  <td style={td}>{safe(row.weight_surcharge_per_kg)}</td>
                  <td style={td}>{safe(row.updated_at)}</td>
                  <td style={td}>
                    <button style={secondaryBtn} onClick={() => editRow(row)}>
                      {tr("Edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!rows.length ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
              {tr("No tariff records found.")}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "#64748b",
  marginBottom: 6,
};
