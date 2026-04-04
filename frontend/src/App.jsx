import React, { useState, useRef } from "react";
import axios from "axios";
import TrustScore from "./components/TrustScore";
import FlagsList from "./components/FlagsList";
import { InfoCard, DataRow, StatusBadge } from "./components/InfoCard";

const API_BASE = "/api";

const EXAMPLE_URLS = [
  "paypa1-secure-login.com",
  "google.com",
  "arnazon-deals.tk",
  "github.com",
  "secure-bankofamerica-login.phishingsite.xyz"
];

function LoadingSpinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{
        width: 44, height: 44,
        border: "3px solid var(--bg3)",
        borderTop: "3px solid var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 16px"
      }}/>
      <p style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
        {message}
      </p>
    </div>
  );
}

function AnalysisSteps({ steps, currentStep }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "16px 0" }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 16px",
          background: i < currentStep ? "rgba(0,255,136,0.06)" : i === currentStep ? "rgba(0,212,255,0.06)" : "var(--bg3)",
          border: `1px solid ${i < currentStep ? "rgba(0,255,136,0.2)" : i === currentStep ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          transition: "all 0.3s ease"
        }}>
          <span style={{
            width: 20, height: 20,
            borderRadius: "50%",
            background: i < currentStep ? "var(--green)" : i === currentStep ? "var(--accent)" : "var(--bg4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px",
            color: "var(--bg)",
            fontWeight: 700,
            flexShrink: 0,
            animation: i === currentStep ? "pulse 1s ease infinite" : "none"
          }}>
            {i < currentStep ? "✓" : i + 1}
          </span>
          <span style={{
            fontSize: "13px",
            color: i < currentStep ? "var(--green)" : i === currentStep ? "var(--accent)" : "var(--text3)",
            fontFamily: "var(--font-mono)"
          }}>{step}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);

  const STEPS = [
    "Parsing URL structure...",
    "Checking DNS resolution...",
    "Querying WHOIS registration...",
    "Fetching website content...",
    "Running AI analysis..."
  ];

  async function handleAnalyze(targetUrl) {
    const urlToAnalyze = (targetUrl || url).trim();
    if (!urlToAnalyze) return;

    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const response = await axios.post(`${API_BASE}/analyze`, { url: urlToAnalyze }, {
        timeout: 75000
      });
      setResult(response.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Analysis failed. Please check the URL and try again.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAnalyze();
  }

  const aiErrored = result?.aiAnalysis?.verdict === "ERROR";
  const verdictColor = result
    ? result.trustScore >= 75 ? "var(--green)"
    : result.trustScore >= 45 ? "var(--orange)"
    : "var(--red)"
    : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="grid-bg"/>
      <div className="scan-line"/>

      {/* Header */}
      <header style={{
        position: "relative",
        zIndex: 10,
        padding: "32px 24px 0",
        textAlign: "center"
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px" }}>🛡️</span>
          <h1 style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, var(--accent), #7b61ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>TRUTHLENS AI</h1>
        </div>
        <p style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em" }}>
          AI-POWERED FRAUD & PHISHING DETECTION
        </p>
      </header>

      {/* Main */}
      <main style={{
        position: "relative",
        zIndex: 10,
        maxWidth: "820px",
        margin: "0 auto",
        padding: "32px 20px 80px"
      }}>

        {/* Search Box */}
        <div style={{
          background: "var(--bg2)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "var(--shadow-glow)"
        }}>
          <label style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--text3)",
            fontFamily: "var(--font-mono)"
          }}>ENTER URL TO ANALYZE</label>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                color: "var(--text3)", fontSize: "14px", pointerEvents: "none"
              }}>🔗</span>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com or paste any URL..."
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 40px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--radius)",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border2)"}
              />
            </div>
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !url.trim()}
              style={{
                padding: "14px 24px",
                background: loading ? "var(--bg4)" : "linear-gradient(135deg, var(--accent), #0066aa)",
                border: "none",
                borderRadius: "var(--radius)",
                color: loading ? "var(--text3)" : "var(--bg)",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                letterSpacing: "0.03em"
              }}
            >
              {loading ? "Scanning..." : "Analyze →"}
            </button>
          </div>

          {/* Example URLs */}
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>TRY:</span>
            {EXAMPLE_URLS.map(ex => (
              <button
                key={ex}
                onClick={() => { setUrl(ex); handleAnalyze(ex); }}
                style={{
                  padding: "4px 10px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: "100px",
                  color: "var(--text3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text3)"; }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "16px 20px",
            background: "rgba(255,61,107,0.08)",
            border: "1px solid rgba(255,61,107,0.3)",
            borderRadius: "var(--radius)",
            color: "var(--red)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            marginBottom: "20px"
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            background: "var(--bg2)",
            border: "1px solid var(--border2)",
            borderRadius: "var(--radius-lg)",
            padding: "24px"
          }}>
            <AnalysisSteps steps={STEPS} currentStep={loadingStep}/>
            <LoadingSpinner message="This may take up to 30 seconds..."/>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Top bar */}
            <div style={{
              padding: "12px 16px",
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text3)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <span>🔍 <span style={{ color: "var(--text2)" }}>{result.analyzedUrl}</span></span>
              <span>⏱ {result.elapsedMs}ms</span>
            </div>

            {/* Score + Verdict panel */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px" }}>
              <TrustScore score={result.trustScore} verdict={result.verdict}/>

              {/* Verdict Card */}
              <div style={{
                background: "var(--bg2)",
                border: `1px solid ${verdictColor}22`,
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>

                {/* AI unavailable notice */}
                {aiErrored && (
                  <div style={{
                    padding: "8px 12px",
                    background: "rgba(255,154,0,0.08)",
                    border: "1px solid rgba(255,154,0,0.3)",
                    borderRadius: "var(--radius)",
                    fontSize: "11px",
                    color: "var(--orange)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.5
                  }}>
                    
                  </div>
                )}

                {/* Verdict badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: `${verdictColor}10`,
                  border: `1px solid ${verdictColor}33`,
                  borderRadius: "var(--radius)"
                }}>
                  <span style={{ fontSize: "20px" }}>
                    {aiErrored ? "🔶" : result.trustScore >= 75 ? "✅" : result.trustScore >= 45 ? "⚠️" : "🚫"}
                  </span>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: "2px" }}>
                      {aiErrored ? "HEURISTIC VERDICT" : "AI VERDICT"}
                    </div>
                    <div style={{ fontWeight: 700, color: verdictColor, fontSize: "15px" }}>
                      {aiErrored ? result.verdict : (result.aiAnalysis?.verdict || result.verdict)}
                    </div>
                  </div>
                </div>

                {/* AI Reasoning (only when AI worked) */}
                {!aiErrored && result.aiAnalysis?.reasoning && (
                  <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.7 }}>
                    {result.aiAnalysis.reasoning}
                  </p>
                )}

                {/* Recommendation */}
                {result.aiAnalysis?.recommendation && !aiErrored && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.15)",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)"
                  }}>
                    💡 {result.aiAnalysis.recommendation}
                  </div>
                )}

                {/* Heuristic summary when AI is down */}
                {aiErrored && (
                  <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.7 }}>
                    {result.criticalFlagCount > 0
                      ? `⛔ ${result.criticalFlagCount} critical flag(s) detected. This URL shows strong indicators of fraud or phishing.`
                      : result.flagCount > 0
                      ? `⚠️ ${result.flagCount} issue(s) found. Treat this URL with caution.`
                      : "✅ No major flags found in automated checks."}
                  </div>
                )}
              </div>
            </div>

            {/* Original Website Comparison */}
            {!aiErrored && result.aiAnalysis?.originalWebsite && result.aiAnalysis.originalWebsite !== "N/A" && (
              <div style={{
                padding: "16px 20px",
                background: "rgba(123,97,255,0.08)",
                border: "1px solid rgba(123,97,255,0.25)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                    ORIGINAL LEGITIMATE WEBSITE
                  </div>
                  <div style={{ fontWeight: 700, color: "#7b61ff", fontSize: "16px" }}>
                    🔒 {result.aiAnalysis.originalWebsite}
                  </div>
                  {result.aiAnalysis.comparisonNotes && (
                    <p style={{ fontSize: "12px", color: "var(--text3)", marginTop: "6px" }}>
                      {result.aiAnalysis.comparisonNotes}
                    </p>
                  )}
                </div>
                {result.aiAnalysis.originalWebsiteUrl && (
                  <a
                    href={result.aiAnalysis.originalWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "10px 18px",
                      background: "rgba(123,97,255,0.15)",
                      border: "1px solid rgba(123,97,255,0.4)",
                      borderRadius: "var(--radius)",
                      color: "#7b61ff",
                      fontWeight: 700,
                      fontSize: "13px",
                      textDecoration: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Visit Real Site →
                  </a>
                )}
              </div>
            )}

            {/* Flags */}
            <InfoCard title="Security Flags" icon="🚩" accentColor={result.criticalFlagCount > 0 ? "var(--red)" : "var(--orange)"}>
              <FlagsList flags={result.flags}/>
            </InfoCard>

            {/* URL Details */}
            <InfoCard title="URL Structure Analysis" icon="🔗" defaultOpen={false}>
              <DataRow label="Full URL" value={result.analyzedUrl} mono/>
              <DataRow label="Protocol" value={result.urlDetails?.protocol} mono highlight={result.urlDetails?.protocol === "http:"}/>
              <DataRow label="Hostname" value={result.urlDetails?.hostname} mono/>
              <DataRow label="Domain" value={result.urlDetails?.domain} mono/>
              <DataRow label="TLD" value={`.${result.urlDetails?.tld}`} mono/>
              <DataRow label="Subdomains" value={result.urlDetails?.subdomains || "none"} mono/>
              <DataRow label="Subdomain Depth" value={result.urlDetails?.subdomainCount}/>
              <DataRow label="URL Length" value={`${result.urlDetails?.urlLength} chars`} mono highlight={result.urlDetails?.urlLength > 100}/>
              <DataRow label="Entropy Score" value={result.urlDetails?.entropy} mono highlight={parseFloat(result.urlDetails?.entropy) > 3.8}/>
            </InfoCard>

            {/* Domain Registration */}
            <InfoCard title="Domain Registration (WHOIS)" icon="📋" defaultOpen={false}>
              <DataRow label="Registered" value={
                result.domainInfo?.registered === null ? "Unknown" :
                result.domainInfo?.registered ? "Yes" : "No"
              } color={result.domainInfo?.registered ? "var(--green)" : "var(--red)"}/>
              <DataRow label="Registration Date" value={
                result.domainInfo?.registrationDate
                  ? new Date(result.domainInfo.registrationDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "Unknown"
              }/>
              <DataRow label="Domain Age" value={
                result.domainInfo?.ageInDays != null
                  ? `${result.domainInfo.ageInDays} days (${Math.floor(result.domainInfo.ageInDays / 30)} months)`
                  : "Unknown"
              } highlight={result.domainInfo?.ageInDays < 180}/>
              <DataRow label="Expiry Date" value={
                result.domainInfo?.expiryDate
                  ? new Date(result.domainInfo.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "Unknown"
              }/>
              <DataRow label="Registrar" value={result.domainInfo?.registrar || "Unknown"}/>
            </InfoCard>

            {/* DNS */}
            <InfoCard title="DNS Resolution" icon="🌐" defaultOpen={false}>
              <DataRow label="Resolves" value={
                <StatusBadge value={result.dnsInfo?.resolves} trueLabel="Yes" falseLabel="No"
                  trueColor="var(--green)" falseColor="var(--red)"/>
              }/>
              <DataRow label="IP Addresses" value={result.dnsInfo?.ipAddresses?.join(", ") || "None"} mono/>
            </InfoCard>

            {/* Website */}
            <InfoCard title="Website Content Analysis" icon="📄" defaultOpen={false}>
              <DataRow label="Accessible" value={
                <StatusBadge value={result.websiteInfo?.accessible} trueColor="var(--green)" falseColor="var(--red)"/>
              }/>
              <DataRow label="HTTP Status" value={result.websiteInfo?.statusCode || "N/A"} mono/>
              <DataRow label="Page Title" value={result.websiteInfo?.title || "None"}/>
              <DataRow label="Description" value={result.websiteInfo?.description || "None"}/>
              <DataRow label="Has Login Form" value={
                <StatusBadge value={result.websiteInfo?.hasLoginForm} trueLabel="Yes" falseLabel="No"
                  trueColor="var(--orange)" falseColor="var(--text3)"/>
              }/>
              <DataRow label="Has Password Field" value={
                <StatusBadge value={result.websiteInfo?.hasPasswordField} trueLabel="Yes" falseLabel="No"
                  trueColor="var(--orange)" falseColor="var(--text3)"/>
              }/>
              <DataRow label="Has Social Links" value={
                <StatusBadge value={result.websiteInfo?.hasSocialLinks} trueColor="var(--green)" falseColor="var(--text3)"/>
              }/>
              <DataRow label="Forms Found" value={result.websiteInfo?.formCount ?? "0"}/>
            </InfoCard>

            {/* AI Top Risks */}
            {!aiErrored && result.aiAnalysis?.topRisks?.length > 0 && (
              <InfoCard title="AI-Identified Top Risks" icon="🤖" accentColor="var(--accent)">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.aiAnalysis.topRisks.map((risk, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "rgba(0,212,255,0.04)",
                      border: "1px solid rgba(0,212,255,0.1)",
                      borderRadius: "var(--radius)",
                      fontSize: "13px",
                      color: "var(--text2)",
                      animation: `slideIn 0.3s ease ${i * 0.08}s both`
                    }}>
                      <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {risk}
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {/* Re-analyze */}
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <button
                onClick={() => { setResult(null); setUrl(""); setTimeout(() => inputRef.current?.focus(), 100); }}
                style={{
                  padding: "12px 28px",
                  background: "transparent",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--radius)",
                  color: "var(--text3)",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.color = "var(--text3)"; }}
              >
                ← Analyze Another URL
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "8px" }}>
            {[
              { icon: "🔤", title: "URL Structure", desc: "Detects typosquatting, excessive subdomains, suspicious TLDs, and URL obfuscation" },
              { icon: "📋", title: "WHOIS Lookup", desc: "Checks domain registration date, age, and registrar to catch newly created phishing domains" },
              { icon: "🌐", title: "DNS Check", desc: "Verifies the domain actually resolves and checks for fast-flux DNS evasion techniques" },
              { icon: "📄", title: "Content Analysis", desc: "Reads the website and checks for login forms, credential harvesting, and suspicious content" },
              { icon: "🤖", title: "AI Analysis", desc: "Claude AI synthesizes all signals to give a verdict, compare with the real site, and explain reasoning" },
              { icon: "🎯", title: "Trust Score", desc: "A 0–100 score combining all checks, giving you a clear, actionable safety assessment" }
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: "20px",
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                transition: "border-color 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "var(--text3)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        padding: "20px",
        borderTop: "1px solid var(--border)",
        color: "var(--text3)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px"
      }}>
        TRUTHLENS AI — For educational and security research use only
      </footer>
    </div>
  );
}
