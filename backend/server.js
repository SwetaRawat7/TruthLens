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

// ✅ Middleware
app.use(helmet());
app.use(cors({
  origin: "*", // allow all (important for Vercel frontend)
}));
app.use(express.json());

// ✅ Test route (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});
app.use("/api/", limiter);

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// ✅ Main API
app.post("/api/analyze", async (req, res) => {
  const startTime = Date.now();
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  try {
    const urlAnalysis = analyzeUrl(url);
    const hostname = urlAnalysis.details.hostname;
    const domain = urlAnalysis.details.domain;

    const [dnsInfo, domainInfo, contentInfo] = await Promise.allSettled([
      checkDnsResolution(hostname),
      checkDomainRegistration(domain),
      fetchWebsiteContent(url)
    ]);

    const dnsResult = dnsInfo.status === "fulfilled" ? dnsInfo.value : {};
    const domainResult = domainInfo.status === "fulfilled" ? domainInfo.value : {};
    const contentResult = contentInfo.status === "fulfilled" ? contentInfo.value : {};

    const aiResult = await analyzeWithAI({
      rawUrl: url,
      urlAnalysis,
      domainInfo: domainResult,
      dnsInfo: dnsResult,
      contentInfo: contentResult
    });

    let trustScore = urlAnalysis.score || 0;

    if (aiResult.aiScore !== null) {
      trustScore = Math.round((trustScore + aiResult.aiScore) / 2);
    }

    let verdict = trustScore > 70 ? "SAFE" : trustScore > 40 ? "SUSPICIOUS" : "HIGH RISK";

    res.json({
      success: true,
      trustScore,
      verdict,
      ai: aiResult,
      time: Date.now() - startTime
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ✅ START SERVER (CRITICAL FOR RENDER)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});