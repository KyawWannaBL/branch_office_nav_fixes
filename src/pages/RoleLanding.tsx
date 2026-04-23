import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/hooks/useT";
import { inferRoleFromBrowserStorage, resolveRoleLanding } from "@/lib/roleLanding";

export default function RoleLanding() {
  const navigate = useNavigate();
  const { t: tr } = useT();

  useEffect(() => {
    const role = inferRoleFromBrowserStorage();
    const target = resolveRoleLanding(role);
    const timer = window.setTimeout(() => {
      navigate(target, { replace: true });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
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
            width: 54,
            height: 54,
            margin: "0 auto 18px",
            borderRadius: 999,
            border: "4px solid #dbe4ee",
            borderTopColor: "#0f766e",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
          {tr("Loading workspace...")}
        </div>
        <div style={{ marginTop: 8, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
          {tr("Redirecting to your role-based workspace.")}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
