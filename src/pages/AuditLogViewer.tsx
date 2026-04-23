// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useT } from "@/hooks/useT";
import { translateMessage } from "@/lib/translateMessage";
import {
  getAllAuditPresets,
  saveAuditPreset,
  deleteAuditPreset,
  type AuditPreset,
} from "@/lib/auditPresets";

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

function pretty(v: any) {
  if (v === null || v === undefined) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function AuditLogViewer() {
  const { lang, t: tr } = useT();

  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState("");

  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presets, setPresets] = useState<AuditPreset[]>([]);

  function refreshPresets() {
    setPresets(getAllAuditPresets());
  }

  function applyPreset(preset: AuditPreset) {
    setSelectedPresetId(preset.id);
    setPresetName(preset.readonly ? "" : preset.name);
    setActor(preset.actor || "");
    setAction(preset.action || "");
    setResource(preset.resource || "");
    setDateFrom(preset.dateFrom || "");
    setDateTo(preset.dateTo || "");
  }

  function saveCurrentPreset() {
    const name = presetName.trim();
    if (!name) {
      setMessage("Preset name is required");
      return;
    }

    const saved = saveAuditPreset({
      name,
      actor,
      action,
      resource,
      dateFrom,
      dateTo,
    });

    refreshPresets();
    if (saved?.id) {
      setSelectedPresetId(saved.id);
    }
    setMessage(`Action completed: ${name}`);
  }

  function deleteCurrentPreset() {
    const preset = presets.find((x) => x.id === selectedPresetId);
    if (!preset || preset.readonly) {
      setMessage("Only custom presets can be deleted");
      return;
    }

    deleteAuditPreset(preset.id);
    refreshPresets();
    setSelectedPresetId("");
    setPresetName("");
    setMessage(`Action completed: ${preset.name}`);
  }

  function exportCsv() {
    const qs = new URLSearchParams();
    if (actor) qs.set("actor", actor);
    if (action) qs.set("action", action);
    if (resource) qs.set("resource", resource);
    if (dateFrom) qs.set("date_from", dateFrom);
    if (dateTo) qs.set("date_to", dateTo);
    qs.set("limit", "5000");
    window.open(`/api/v1/audit/export?${qs.toString()}`, "_blank", "noopener,noreferrer");
  }

  async function loadData() {
    setMessage("");
    try {
      const qs = new URLSearchParams();
      if (actor) qs.set("actor", actor);
      if (action) qs.set("action", action);
      if (resource) qs.set("resource", resource);
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);
      qs.set("limit", "500");

      const res = await fetch(`/api/v1/audit/logs?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");

      const list = Array.isArray(data?.data) ? data.data : [];
      setRows(list);
      setSummary(data?.summary || null);
      setSelected(list[0] || null);
    } catch (error: any) {
      setMessage(error?.message || "Failed to load");
      setRows([]);
      setSelected(null);
      setSummary(null);
    }
  }

  useEffect(() => {
    refreshPresets();
    void loadData();
  }, []);

  const selectedPayload = useMemo(() => pretty(selected?.payload), [selected]);
  const selectedBefore = useMemo(() => pretty(selected?.before_state), [selected]);
  const selectedAfter = useMemo(() => pretty(selected?.after_state), [selected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            {tr("Audit Logs")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Audit Log Viewer")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Inspect read-only privileged action logs with filters for actor, action, resource, and date range.")}
          </p>
        </div>
      </section>

      {message ? (
        <div style={{ border: "1px solid #a5f3fc", background: "#ecfeff", color: "#0f766e", padding: "12px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
          {translateMessage(lang, message)}
        </div>
      ) : null}

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{tr("Saved Presets")}</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 14px",
                fontWeight: 800,
                cursor: "pointer",
                background: selectedPresetId === preset.id ? "#0f2f5c" : "#f8fafc",
                color: selectedPresetId === preset.id ? "#fff" : "#334155",
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) auto auto", gap: 12, alignItems: "end" }}>
          <div>
            <div style={filterLabel}>{tr("Preset Name")}</div>
            <input
              style={inputStyle}
              placeholder={tr("Preset Name")}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
          </div>

          <button style={primaryBtn} onClick={saveCurrentPreset}>{tr("Save Preset")}</button>
          <button style={secondaryBtn} onClick={deleteCurrentPreset}>{tr("Delete Preset")}</button>
        </div>
      </section>

      <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr)) auto", gap: 12, alignItems: "end" }}>
        <div>
          <div style={filterLabel}>{tr("Actor")}</div>
          <input style={inputStyle} placeholder={tr("Actor")} value={actor} onChange={(e) => setActor(e.target.value)} />
        </div>
        <div>
          <div style={filterLabel}>{tr("Action")}</div>
          <input style={inputStyle} placeholder={tr("Action")} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
        <div>
          <div style={filterLabel}>{tr("Resource")}</div>
          <input style={inputStyle} placeholder={tr("Resource")} value={resource} onChange={(e) => setResource(e.target.value)} />
        </div>
        <div>
          <div style={filterLabel}>{tr("Date From")}</div>
          <input style={inputStyle} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <div style={filterLabel}>{tr("Date To")}</div>
          <input style={inputStyle} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={primaryBtn} onClick={loadData}>{tr("Apply")}</button>
          <button style={secondaryBtn} onClick={exportCsv}>{tr("Export CSV")}</button>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <Metric label={tr("Total Logs")} value={safe(summary?.total_logs, "0")} strong />
        <Metric label={tr("Unique Actors")} value={safe(summary?.unique_actors, "0")} />
        <Metric label={tr("Unique Actions")} value={safe(summary?.unique_actions, "0")} />
        <Metric label={tr("Unique Resources")} value={safe(summary?.unique_resources, "0")} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(420px,1fr) minmax(0,1.15fr)", gap: 18 }}>
        <section style={card}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>{tr("Log Entries")}</div>
          <div style={{ overflow: "auto", maxHeight: 760 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Occurred At", "Actor", "Action", "Resource", "Target Status"].map((x) => (
                    <th key={x} style={th}>{tr(x)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    style={{
                      cursor: "pointer",
                      background: selected?.id === row.id ? "#eff6ff" : "#fff",
                    }}
                  >
                    <td style={td}>{safe(row.occurred_at)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{safe(row.actor_name)}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{safe(row.actor_role)}</div>
                    </td>
                    <td style={td}>{safe(row.action)}</td>
                    <td style={td}>
                      <div>{safe(row.resource_type)}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{safe(row.resource_id)}</div>
                    </td>
                    <td style={td}>{safe(row.target_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!rows.length && (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {tr("No records found for this queue.")}
              </div>
            )}
          </div>
        </section>

        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{tr("Selected Log Detail")}</div>

          {selected ? (
            <>
              <Metric label={tr("Request ID")} value={safe(selected.request_id)} strong />
              <Metric label={tr("Actor Email")} value={safe(selected.actor_email)} />
              <Metric label={tr("User Agent")} value={safe(selected.user_agent)} />
              <Metric label={tr("Source IP")} value={safe(selected.source_ip)} />
              <Metric label={tr("Action")} value={safe(selected.action)} />
              <Metric label={tr("Resource Type")} value={safe(selected.resource_type)} />
              <Metric label={tr("Resource ID")} value={safe(selected.resource_id)} />
              <Metric label={tr("Target Status")} value={safe(selected.target_status)} />

              <JsonPanel title={tr("Payload")} value={selectedPayload} />
              <JsonPanel title={tr("Before State")} value={selectedBefore} />
              <JsonPanel title={tr("After State")} value={selectedAfter} />
            </>
          ) : (
            <div style={{ color: "#64748b" }}>{tr("No log selected.")}</div>
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
      <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900, color: "#0f172a", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function JsonPanel({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #dbe4ee", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div style={{ padding: "12px 14px", fontWeight: 800, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>{title}</div>
      <pre style={{ margin: 0, padding: 14, maxHeight: 220, overflow: "auto", fontSize: 12, lineHeight: 1.55, color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {value || "-"}
      </pre>
    </div>
  );
}

const filterLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "#64748b",
  marginBottom: 6,
};

const th: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #dbe4ee",
  fontWeight: 800,
  color: "#334155",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  verticalAlign: "top",
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
