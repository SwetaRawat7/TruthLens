require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { analyzeUrl } = require("./utils/urlAnalyzer");
const { checkDomainRegistration, checkDnsResolution } = require("./utils/domainChecker");
const { fetchWebsiteContent } = require("./utils/contentAnalyzer");
const { analyzeWithAI } = require("./utils/aiAnalyzer");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MIDDLEWARE
app.use(helmet());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ RATE LIMIT (added message for clarity)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Try again later." }
});
app.use("/api/", limiter);

// ✅ ROOT ROUTE (IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// ✅ HEALTH CHECK (improved)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: !!process.env.ANTHROPIC_API_KEY,
    whoisEnabled: !!process.env.WHOISXML_API_KEY
  });
});

// ✅ MAIN API
app.post("/api/analyze", async (req, res) => {
  const startTime = Date.now();
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Valid URL required" });
  }

  try {
    const cleanUrl = url.trim();

    // 🔹 STEP 1: URL ANALYSIS
    const urlAnalysis = analyzeUrl(cleanUrl);
    const hostname = urlAnalysis?.details?.hostname;
    const domain = urlAnalysis?.details?.domain;

    // 🔹 STEP 2: PARALLEL CHECKS (SAFE)
    const [dnsInfo, domainInfo, contentInfo] = await Promise.allSettled([
      hostname ? checkDnsResolution(hostname) : Promise.resolve(null),
      domain ? checkDomainRegistration(domain) : Promise.resolve(null),
      fetchWebsiteContent(cleanUrl)
    ]);

    const dnsResult = dnsInfo.status === "fulfilled" && dnsInfo.value
      ? dnsInfo.value
      : { resolves: false, flags: [], score: 0 };

    const domainResult = domainInfo.status === "fulfilled" && domainInfo.value
      ? domainInfo.value
      : { registered: null, flags: [], score: 0 };

    const contentResult = contentInfo.status === "fulfilled" && contentInfo.value
      ? contentInfo.value
      : { accessible: false, flags: [], score: 0 };

    // 🔹 STEP 3: AI ANALYSIS
    let aiResult = { aiScore: null, analysis: "AI not available" };

    try {
      aiResult = await analyzeWithAI({
        rawUrl: cleanUrl,
        urlAnalysis,
        domainInfo: domainResult,
        dnsInfo: dnsResult,
        contentInfo: contentResult
      });
    } catch (e) {
      console.log("AI failed, continuing...");
    }

    // 🔹 STEP 4: TRUST SCORE (IMPROVED)
    let trustScore =
      (urlAnalysis?.score || 0) +
      (domainResult?.score || 0) +
      (dnsResult?.score || 0) +
      (contentResult?.score || 0);

    if (aiResult.aiScore !== null) {
      trustScore = Math.round((trustScore * 0.5) + (aiResult.aiScore * 0.5));
    }

    trustScore = Math.max(0, Math.min(100, trustScore));

    // 🔹 STEP 5: VERDICT
    let verdict = "HIGH RISK";
    if (trustScore >= 75) verdict = "LIKELY SAFE";
    else if (trustScore >= 45) verdict = "SUSPICIOUS";

    // 🔹 FLAGS (combined)
    const flags = [
      ...(urlAnalysis?.flags || []),
      ...(domainResult?.flags || []),
      ...(dnsResult?.flags || []),
      ...(contentResult?.flags || [])
    ];

    res.json({
      success: true,
      analyzedUrl: cleanUrl,
      trustScore,
      verdict,
      time: Date.now() - startTime,
      flags,
      ai: aiResult
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Analysis failed"
    });
  }
});

// ✅ 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ✅ START SERVER (CRITICAL)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});