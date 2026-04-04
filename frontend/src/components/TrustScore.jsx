import React, { useEffect, useState } from "react";

export default function TrustScore({ score, verdict, verdictColor }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = score / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= score) { setDisplayed(score); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = ((100 - displayed) / 100) * circumference;

  const color = score >= 75 ? "var(--green)" : score >= 45 ? "var(--orange)" : "var(--red)";
  const bgColor = score >= 75 ? "rgba(0,255,136,0.08)" : score >= 45 ? "rgba(255,154,0,0.08)" : "rgba(255,61,107,0.08)";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      padding: "32px",
      background: bgColor,
      border: `1px solid ${color}22`,
      borderRadius: "var(--radius-lg)",
      animation: "fadeIn 0.5s ease both"
    }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--bg3)" strokeWidth="10"/>
          {/* Score arc */}
          <circle
            cx="90" cy="90" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{
            fontSize: "42px",
            fontWeight: 800,
            color,
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
            textShadow: `0 0 20px ${color}55`
          }}>{displayed}</span>
          <span style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.1em", marginTop: 4 }}>TRUST SCORE</span>
        </div>
      </div>

      <div style={{
        padding: "8px 20px",
        borderRadius: "100px",
        background: `${color}18`,
        border: `1px solid ${color}44`,
        color,
        fontWeight: 700,
        fontSize: "13px",
        letterSpacing: "0.12em",
        textTransform: "uppercase"
      }}>
        {verdict}
      </div>
    </div>
  );
}
