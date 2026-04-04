import { useState } from "react";
import axios from "axios";

const API_BASE = "https://truthlens-backend-sue6.onrender.com";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeUrl = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/analyze`,
        { url },
        { timeout: 75000 }
      );
      setResult(response.data);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "Server error");
      } else {
        setError("Backend sleeping 😴 or network issue");
      }
    } finally {
      setLoading(false);
    }
  };

  const score = result?.trust_score ?? result?.trustScore ?? 0;
  const verdict = result?.verdict ?? "UNKNOWN";

  return (
    <div style={styles.page}>
      <div style={styles.glow}></div>

      <h1 style={styles.title}>🔍 TruthLens AI</h1>

      {/* INPUT CARD */}
      <div style={styles.card}>
        <input
          type="text"
          placeholder="Paste suspicious URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.input}
        />

        <button onClick={analyzeUrl} style={styles.button}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* RESULT CARD */}
      {result && (
        <div style={{ ...styles.card, animation: "fadeIn 0.6s ease" }}>
          <h2>Analysis Result</h2>

          {/* Animated Badge */}
          <div
            style={{
              ...styles.badge,
              background:
                verdict === "HIGH RISK"
                  ? "#ef4444"
                  : verdict === "MEDIUM RISK"
                  ? "#f59e0b"
                  : "#22c55e",
            }}
          >
            {verdict}
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: "15px" }}>
            <p>Trust Score: {score}</p>

            <div style={styles.progressBg}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${score}%`,
                }}
              />
            </div>
          </div>

          {/* Flags */}
          <div style={{ marginTop: "15px" }}>
            <h3>⚠️ Risk Factors</h3>
            <ul>
              {Array.isArray(result.flags) && result.flags.length > 0 ? (
                result.flags.map((f, i) => (
                  <li key={i}>
                    {typeof f === "string" ? f : f.message}
                  </li>
                ))
              ) : (
                <li>No issues detected</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    fontFamily: "sans-serif",
    position: "relative",
  },

  glow: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, #3b82f6, transparent)",
    filter: "blur(120px)",
    top: "10%",
    left: "30%",
  },

  title: {
    fontSize: "40px",
    marginBottom: "30px",
    letterSpacing: "1px",
  },

  card: {
    backdropFilter: "blur(15px)",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    marginBottom: "20px",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginBottom: "10px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg, #3b82f6, #6366f1)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },

  error: {
    color: "#f87171",
    marginTop: "10px",
  },

  badge: {
    padding: "8px 16px",
    borderRadius: "999px",
    display: "inline-block",
    marginTop: "10px",
    fontWeight: "bold",
    animation: "fadeIn 0.5s ease",
  },

  progressBg: {
    height: "10px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #22c55e)",
    transition: "width 0.5s ease",
  },
};

export default App;