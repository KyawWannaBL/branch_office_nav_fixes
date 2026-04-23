// @ts-nocheck
import React, { useState } from "react";
import { useT } from "@/hooks/useT";

export default function DeliveredRegistration() {
  const { lang, t: tr } = useT();
  const [batch, setBatch] = useState({
    delivery_date: new Date().toISOString().slice(0, 10),
    hub_code: "YGN",
    rider_name: "",
    vehicle_no: "",
    remarks: "",
  });

  const [rows, setRows] = useState([
    { pickup_id: "", delivery_id: "", receiver_name: "", receiver_phone: "", pod_note: "" },
  ]);

  const [message, setMessage] = useState("");

  const save = async () => {
    setMessage("");
    const res = await fetch("/api/v1/delivered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch, items: rows }),
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data?.error || "Failed to save delivered batch");
    setMessage(`Delivered batch saved: ${data.delivered_reg_id}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Delivered ID Registration</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 }}>
        <input value={batch.delivery_date} onChange={(e) => setBatch({ ...batch, delivery_date: e.target.value })} type="date" />
        <input value={batch.hub_code} onChange={(e) => setBatch({ ...batch, hub_code: e.target.value })} placeholder="Hub" />
        <input value={batch.rider_name} onChange={(e) => setBatch({ ...batch, rider_name: e.target.value })} placeholder="Rider" />
        <input value={batch.vehicle_no} onChange={(e) => setBatch({ ...batch, vehicle_no: e.target.value })} placeholder="Vehicle" />
      </div>

      <div style={{ marginTop: 24 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input value={row.pickup_id} onChange={(e) => {
              const next = [...rows];
              next[i].pickup_id = e.target.value;
              setRows(next);
            }} placeholder="Pickup ID" />
            <input value={row.delivery_id} onChange={(e) => {
              const next = [...rows];
              next[i].delivery_id = e.target.value;
              setRows(next);
            }} placeholder="Delivery ID" />
            <input value={row.receiver_name} onChange={(e) => {
              const next = [...rows];
              next[i].receiver_name = e.target.value;
              setRows(next);
            }} placeholder="Receiver Name" />
            <input value={row.receiver_phone} onChange={(e) => {
              const next = [...rows];
              next[i].receiver_phone = e.target.value;
              setRows(next);
            }} placeholder="Receiver Phone" />
            <input value={row.pod_note} onChange={(e) => {
              const next = [...rows];
              next[i].pod_note = e.target.value;
              setRows(next);
            }} placeholder="POD Note" />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setRows([...rows, { pickup_id: "", delivery_id: "", receiver_name: "", receiver_phone: "", pod_note: "" }])}>
          Add Delivered Row
        </button>
        <button onClick={save}>Save Delivered Registration</button>
      </div>

      {message ? <div style={{ marginTop: 16 }}>{message}</div> : null}
    </div>
  );
}
