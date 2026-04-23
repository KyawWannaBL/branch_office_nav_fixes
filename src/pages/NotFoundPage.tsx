import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg,#fff 0%,#f8fafc 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          border: "1px solid #dbe4ee",
          borderRadius: 24,
          background: "#fff",
          padding: 28,
          boxShadow: "0 16px 40px rgba(15,23,42,.08)",
          textAlign: "center",
        }}
      >
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
          404
        </div>

        <h1 style={{ margin: "16px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
          Page not found
        </h1>

        <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
          The page you requested does not exist or has moved.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <Link
            to="/dashboard"
            style={{
              textDecoration: "none",
              borderRadius: 12,
              background: "#0f766e",
              color: "#fff",
              padding: "12px 16px",
              fontWeight: 800,
            }}
          >
            Go to Dashboard
          </Link>

          <Link
            to="/create-delivery"
            style={{
              textDecoration: "none",
              borderRadius: 12,
              background: "#0f2f5c",
              color: "#fff",
              padding: "12px 16px",
              fontWeight: 800,
            }}
          >
            Open Create Delivery
          </Link>
        </div>
      </div>
    </div>
  );
}
