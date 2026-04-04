import React, { useState } from "react";

export function InfoCard({ title, icon, children, defaultOpen = true, accentColor }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: "var(--bg2)",
      border: `1px solid ${accentColor ? accentColor + "33" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: accentColor ? `0 0 20px ${accentColor}08` : "none"
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          borderBottom: open ? "1px solid var(--border)" : "none",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: "14px"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{icon}</span>
          <span style={{ letterSpacing: "0.05em" }}>{title}</span>
        </span>
        <span style={{ color: "var(--text3)", fontSize: "12px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "20px", animation: "fadeIn 0.25s ease both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DataRow({ label, value, mono, highlight, color }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid var(--border)",
      gap: "16px"
    }}>
      <span style={{ fontSize: "12px", color: "var(--text3)", flexShrink: 0, paddingTop: "1px" }}>{label}</span>
      <span style={{
        fontSize: "13px",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
        color: color || (highlight ? "var(--accent)" : "var(--text2)"),
        textAlign: "right",
        wordBreak: "break-all"
      }}>{value ?? "—"}</span>
    </div>
  );
}

export function StatusBadge({ value, trueLabel = "Yes", falseLabel = "No", trueColor = "var(--green)", falseColor = "var(--text3)" }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      color: value ? trueColor : falseColor,
      fontFamily: "var(--font-mono)",
      fontSize: "12px"
    }}>
      <span>{value ? "●" : "○"}</span>
      {value ? trueLabel : falseLabel}
    </span>
  );
}
