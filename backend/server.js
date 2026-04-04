import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { parse } = require("tldts");

const { analyzeUrl } = require("./utils/urlAnalyzer");
const { checkDomainRegistration, checkDnsResolution } = require("./utils/domainChecker");
const { fetchWebsiteContent } = require("./utils/contentAnalyzer");
const { analyzeWithAI } = require("./utils/aiAnalyzer");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many requests. Please wait before trying again." }
});
app.use("/api/", limiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    aiEnabled: !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"),
    whoisEnabled: !!(process.env.WHOISXML_API_KEY && process.env.WHOISXML_API_KEY !== "your_whoisxml_api_key_here")
  });
});

// Main URL analysis endpoint
app.post("/api/analyze", async (req, res) => {
  const startTime = Date.now();
  const { url } = req.body;

  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a valid URL." });
  }

  if (url.trim().length > 2048) {
    return res.status(400).json({ error: "URL is too long (max 2048 characters)." });
  }

  const rawUrl = url.trim();

  try {
    // Step 1: URL structure analysis (synchronous, fast)
    console.log(`[Analysis] Starting for: ${rawUrl}`);
    const urlAnalysis = analyzeUrl(rawUrl);

    const hostname = urlAnalysis.details.hostname;
    const domain = urlAnalysis.details.domain;

    // Step 2: Run DNS, WHOIS, and website fetch in parallel
    console.log(`[Analysis] Running parallel checks...`);
    const [dnsInfo, domainInfo, contentInfo] = await Promise.allSettled([
      checkDnsResolution(hostname),
      checkDomainRegistration(domain),
      fetchWebsiteContent(rawUrl)
    ]);

    const dnsResult = dnsInfo.status === "fulfilled" ? dnsInfo.value : { resolves: false, flags: [], score: 0, ipAddresses: [] };
    const domainResult = domainInfo.status === "fulfilled" ? domainInfo.value : { registered: null, flags: [], score: 0 };
    const contentResult = contentInfo.status === "fulfilled" ? contentInfo.value : { accessible: false, flags: [], score: 0 };

    // Step 3: AI analysis
    console.log(`[Analysis] Running AI analysis...`);
    const suggestedOriginal = urlAnalysis.flags.find(f => f.suggestedOriginal)?.suggestedOriginal;
    const aiResult = await analyzeWithAI({
      rawUrl,
      urlAnalysis,
      domainInfo: domainResult,
      dnsInfo: dnsResult,
      contentInfo: contentResult,
      suggestedOriginal
    });

    // Step 4: Calculate final trust score
    let trustScore = urlAnalysis.score;
    trustScore += (domainResult.score || 0);
    trustScore += (dnsResult.score || 0);
    trustScore += (contentResult.score || 0);

    // Blend with AI score if available
    if (aiResult.aiScore !== null) {
      trustScore = Math.round(trustScore * 0.5 + aiResult.aiScore * 0.5);
    }

    trustScore = Math.max(0, Math.min(100, trustScore));

    // Step 5: Determine overall verdict
    let verdict;
    let verdictColor;
    if (trustScore >= 75) {
      verdict = "LIKELY SAFE";
      verdictColor = "green";
    } else if (trustScore >= 45) {
      verdict = "SUSPICIOUS";
      verdictColor = "orange";
    } else {
      verdict = "HIGH RISK";
      verdictColor = "red";
    }

    // Collect all flags
    const allFlags = [
      ...urlAnalysis.flags,
      ...domainResult.flags,
      ...dnsResult.flags,
      ...contentResult.flags
    ];

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allFlags.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    const elapsedMs = Date.now() - startTime;
    console.log(`[Analysis] Completed in ${elapsedMs}ms. Score: ${trustScore}, Verdict: ${verdict}`);

    res.json({
      success: true,
      analyzedUrl: rawUrl,
      trustScore,
      verdict,
      verdictColor,
      elapsedMs,

      // Structured details
      urlDetails: {
        hostname: urlAnalysis.details.hostname,
        domain: urlAnalysis.details.domain,
        tld: urlAnalysis.details.tld,
        subdomains: urlAnalysis.details.subdomains,
        protocol: urlAnalysis.details.protocol,
        urlLength: urlAnalysis.details.urlLength,
        entropy: urlAnalysis.details.entropy,
        subdomainCount: urlAnalysis.details.subdomainCount
      },

      domainInfo: {
        registered: domainResult.registered,
        ageInDays: domainResult.ageInDays,
        registrationDate: domainResult.registrationDate,
        expiryDate: domainResult.expiryDate,
        registrar: domainResult.registrar
      },

      dnsInfo: {
        resolves: dnsResult.resolves,
        ipAddresses: dnsResult.ipAddresses
      },

      websiteInfo: {
        accessible: contentResult.accessible,
        statusCode: contentResult.statusCode,
        title: contentResult.title,
        description: contentResult.description,
        hasLoginForm: contentResult.hasLoginForm,
        hasPasswordField: contentResult.hasPasswordField,
        hasSocialLinks: contentResult.hasSocialLinks,
        formCount: contentResult.forms?.length || 0
      },

      aiAnalysis: {
        verdict: aiResult.aiVerdict,
        reasoning: aiResult.aiReasoning,
        originalWebsite: aiResult.originalWebsite,
        originalWebsiteUrl: aiResult.originalWebsiteUrl,
        comparisonNotes: aiResult.comparisonNotes,
        topRisks: aiResult.topRisks || [],
        recommendation: aiResult.recommendation
      },

      flags: allFlags,
      flagCount: allFlags.length,
      criticalFlagCount: allFlags.filter(f => f.severity === "critical").length
    });

  } catch (err) {
    console.error("[Analysis] Fatal error:", err);
    res.status(500).json({
      success: false,
      error: "Analysis failed: " + err.message
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  TRUTHLENS AI Backend running on http://localhost:${PORT}`);
  console.log(`   AI Analysis: ${process.env.ANTHROPIC_API_KEY ? "✅ Enabled" : "❌ Disabled (add ANTHROPIC_API_KEY)"}`);
  console.log(`   WHOIS API:   ${process.env.WHOISXML_API_KEY ? "✅ Enabled" : "⚠️  Using free RDAP fallback"}\n`);
});
