// @ts-nocheck
import React, { useState } from "react";
import { useT } from "@/hooks/useT";

export default function DailyConsolidation() {
  const { lang, t: tr } = useT();
  const [batch, setBatch] = useState({
    consolidation_date: new Date().toISOString().slice(0, 10),
    hub_code: "YGN",
    route_code: "",
    vehicle_no: "",
    driver_name: "",
    remarks: "",
  });

  const [pickupIds, setPickupIds] = useState([""]);
  const [message, setMessage] = useState("");

  const save = async () => {
    setMessage("");
    const res = await fetch("/api/v1/consolidations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch, pickup_ids: pickupIds.filter(Boolean) }),
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data?.error || "Failed to create consolidation");
    setMessage(`Consolidated batch created: ${data.consolidated_id}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Daily Consolidated Pickup IDs</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginTop: 16 }}>
        <input type="date" value={batch.consolidation_date} onChange={(e) => setBatch({ ...batch, consolidation_date: e.target.value })} />
        <input value={batch.hub_code} onChange={(e) => setBatch({ ...batch, hub_code: e.target.value })} placeholder="Hub" />
        <input value={batch.route_code} onChange={(e) => setBatch({ ...batch, route_code: e.target.value })} placeholder="Route" />
        <input value={batch.vehicle_no} onChange={(e) => setBatch({ ...batch, vehicle_no: e.target.value })} placeholder="Vehicle" />
        <input value={batch.driver_name} onChange={(e) => setBatch({ ...batch, driver_name: e.target.value })} placeholder="Driver" />
      </div>

      <div style={{ marginTop: 24 }}>
        {pickupIds.map((pickupId, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <input
              style={{ width: 420 }}
              value={pickupId}
              onChange={(e) => {
                const next = [...pickupIds];
                next[i] = e.target.value;
                setPickupIds(next);
              }}
              placeholder="Pickup ID"
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setPickupIds([...pickupIds, ""])}>Add Pickup ID</button>
        <button onClick={save}>Create Consolidated ID</button>
      </div>

      {message ? <div style={{ marginTop: 16 }}>{message}</div> : null}
    </div>
  );
}
