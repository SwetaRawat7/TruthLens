import React, { useState } from "react";

const SEVERITY_CONFIG = {
  critical: { color: "var(--critical)", bg: "rgba(255,61,107,0.1)", icon: "⛔", label: "CRITICAL" },
  high:     { color: "var(--high)",     bg: "rgba(255,112,67,0.1)", icon: "🚨", label: "HIGH" },
  medium:   { color: "var(--medium)",   bg: "rgba(255,215,64,0.1)", icon: "⚠️", label: "MEDIUM" },
  low:      { color: "var(--low)",      bg: "rgba(105,240,174,0.1)", icon: "ℹ️", label: "LOW" }
};

export default function FlagsList({ flags }) {
  const [expanded, setExpanded] = useState(true);
  if (!flags || flags.length === 0) {
    return (
      <div style={{
        padding: "20px",
        background: "rgba(0,255,136,0.06)",
        border: "1px solid rgba(0,255,136,0.2)",
        borderRadius: "var(--radius)",
        color: "var(--green)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px"
      }}>
        <span>✅</span>
        <span>No suspicious flags detected. URL appears clean.</span>
      </div>
    );
  }

  const grouped = { critical: [], high: [], medium: [], low: [] };
  flags.forEach(f => {
    const sev = f.severity in grouped ? f.severity : "low";
    grouped[sev].push(f);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          fontWeight: 600
        }}
      >
        <span>🚩 {flags.length} Flag{flags.length !== 1 ? "s" : ""} Detected</span>
        <span style={{ color: "var(--text3)" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && Object.entries(grouped).map(([severity, items]) => {
        if (items.length === 0) return null;
        const cfg = SEVERITY_CONFIG[severity];
        return (
          <div key={severity} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {items.map((flag, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}33`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  animation: `slideIn 0.3s ease ${i * 0.05}s both`
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px"
                  }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: cfg.color,
                      fontFamily: "var(--font-mono)"
                    }}>{cfg.label}</span>
                    <span style={{
                      fontSize: "10px",
                      color: "var(--text3)",
                      fontFamily: "var(--font-mono)"
                    }}>{flag.type?.replace(/_/g, " ").toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.5 }}>{flag.message}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
