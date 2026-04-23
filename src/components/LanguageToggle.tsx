import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(15,23,42,.92)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 999,
        boxShadow: "0 12px 28px rgba(15,23,42,.28)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em" }}>Language</span>
      <button
        onClick={() => setLang("en")}
        style={{
          border: "none",
          borderRadius: 999,
          padding: "8px 12px",
          fontWeight: 800,
          cursor: "pointer",
          background: lang === "en" ? "#0f766e" : "#334155",
          color: "#fff",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLang("my")}
        style={{
          border: "none",
          borderRadius: 999,
          padding: "8px 12px",
          fontWeight: 800,
          cursor: "pointer",
          background: lang === "my" ? "#0f766e" : "#334155",
          color: "#fff",
        }}
      >
        မြန်မာ
      </button>
    </div>
  );
}
