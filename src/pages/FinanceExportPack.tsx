// @ts-nocheck
import React, { useState } from "react";
import { useT } from "@/hooks/useT";

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

export default function FinanceExportPack() {
  const { t: tr } = useT();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [riderName, setRiderName] = useState("");

  function openPack(pack: string) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set("date_from", dateFrom);
    if (dateTo) qs.set("date_to", dateTo);
    if (riderName) qs.set("rider_name", riderName);
    qs.set("pack", pack);
    window.open(`/api/v1/exports/finance-pack?${qs.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>
            {tr("Finance Export")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Finance Export Pack")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Export dispatch closeout, rider handover, and delivery closeout detail packs for finance reconciliation.")}
          </p>
        </div>
      </section>

      <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <input style={inputStyle} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input style={inputStyle} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <input style={inputStyle} placeholder={tr("Rider Name")} value={riderName} onChange={(e) => setRiderName(e.target.value)} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
        <ExportCard
          title={tr("Dispatch Closeout Pack")}
          desc={tr("Closed dispatch batch summary for finance review.")}
          onClick={() => openPack("dispatch_closeout")}
        />
        <ExportCard
          title={tr("Rider Handover Pack")}
          desc={tr("Saved rider handover reports for reconciliation.")}
          onClick={() => openPack("rider_handover")}
        />
        <ExportCard
          title={tr("Delivery Closeout Detail")}
          desc={tr("Delivery-level closeout detail linked to closed batches.")}
          onClick={() => openPack("delivery_closeout_detail")}
        />
      </section>
    </div>
  );
}

function ExportCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{title}</div>
      <div style={{ marginTop: 8, color: "#64748b", lineHeight: 1.7 }}>{desc}</div>
      <button
        onClick={onClick}
        style={{
          marginTop: 16,
          border: "none",
          borderRadius: 12,
          background: "#0f766e",
          color: "#fff",
          padding: "12px 16px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Export CSV
      </button>
    </div>
  );
}
