import React, { useEffect, useState } from "react";

export default function TrustScore({ score = 0 }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = score / 50;

    const timer = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = ((100 - displayed) / 100) * circumference;

  // ✅ SAFE LOGIC (NO backend dependency)
  let verdict = "Unknown";
  let color = "#999";

  if (score >= 75) {
    verdict = "Safe";
    color = "#00ff88";
  } else if (score >= 45) {
    verdict = "Suspicious";
    color = "#ff9a00";
  } else {
    verdict = "Danger";
    color = "#ff3d6b";
  }

  const bgColor =
    score >= 75
      ? "rgba(0,255,136,0.08)"
      : score >= 45
      ? "rgba(255,154,0,0.08)"
      : "rgba(255,61,107,0.08)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "32px",
        background: bgColor,
        border: `1px solid ${color}22`,
        borderRadius: "16px",
      }}
    >
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#eee"
            strokeWidth="10"
          />

          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{
              transition: "stroke-dashoffset 0.2s ease",
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color,
            }}
          >
            {displayed}
          </span>

          <span style={{ fontSize: "12px", color: "#666" }}>
            TRUST SCORE
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "8px 20px",
          borderRadius: "100px",
          background: `${color}20`,
          border: `1px solid ${color}44`,
          color,
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {verdict}
      </div>
    </div>
  );
}