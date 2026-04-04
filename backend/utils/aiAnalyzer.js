const axios = require("axios");

async function analyzeWithAI(urlData) {
  const {
    rawUrl,
    urlAnalysis,
    domainInfo,
    dnsInfo,
    contentInfo,
    suggestedOriginal
  } = urlData;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return {
      aiVerdict: "API key not configured",
      aiReasoning: "Add your ANTHROPIC_API_KEY to the .env file to enable AI-powered analysis.",
      originalWebsite: suggestedOriginal || null,
      aiScore: null,
      comparisonNotes: null
    };
  }

  const prompt = `You are a cybersecurity expert specializing in URL and website fraud detection. Analyze the following URL and provide a detailed fraud assessment.

## URL Being Analyzed
${rawUrl}

## Automated Analysis Results

### URL Structure Flags:
${urlAnalysis.flags.map(f => `- [${f.severity.toUpperCase()}] ${f.message}`).join("\n") || "No flags"}

### Domain Info:
- Domain: ${urlAnalysis.details.domain}
- TLD: .${urlAnalysis.details.tld}
- Subdomains: ${urlAnalysis.details.subdomains || "none"}
- Closest brand match: ${urlAnalysis.details.closestBrand} (distance: ${urlAnalysis.details.typosquattingDistance})
- URL Length: ${urlAnalysis.details.urlLength} characters
- Entropy: ${urlAnalysis.details.entropy}

### Domain Registration:
- Registered: ${domainInfo.registered}
- Age: ${domainInfo.ageInDays !== null ? domainInfo.ageInDays + " days" : "Unknown"}
- Registration Date: ${domainInfo.registrationDate || "Unknown"}
- Registrar: ${domainInfo.registrar || "Unknown"}
- Domain flags: ${domainInfo.flags.map(f => f.message).join("; ") || "None"}

### DNS Resolution:
- Resolves: ${dnsInfo.resolves}
- IP Addresses: ${dnsInfo.ipAddresses?.join(", ") || "None"}

### Website Content:
- Accessible: ${contentInfo.accessible}
- Status Code: ${contentInfo.statusCode}
- Title: "${contentInfo.title || "None"}"
- Description: "${contentInfo.description || "None"}"
- Has Password Field: ${contentInfo.hasPasswordField}
- Has Login Form: ${contentInfo.hasLoginForm}
- Has Social Links: ${contentInfo.hasSocialLinks}
- Content Snippet: "${contentInfo.bodyText?.substring(0, 500) || "No content"}"
- Content Flags: ${contentInfo.flags.map(f => f.message).join("; ") || "None"}

## Your Task
1. Based on ALL the above data, determine if this URL is LEGITIMATE, SUSPICIOUS, or FRAUDULENT.
2. Identify what the original/legitimate website should be (e.g., if this is impersonating PayPal, state "paypal.com"). If no brand is being impersonated, state "N/A".
3. Compare this URL's characteristics to what the legitimate site would look like.
4. Give clear, human-readable reasoning in 3-5 sentences.
5. Suggest a trust score from 0-100 (0=definitely fraud, 100=completely trusted).

Respond ONLY in valid JSON with this exact structure:
{
  "verdict": "LEGITIMATE" | "SUSPICIOUS" | "FRAUDULENT",
  "originalWebsite": "domain.com or N/A",
  "originalWebsiteUrl": "https://domain.com or null",
  "trustScore": 0-100,
  "reasoning": "Your 3-5 sentence explanation here",
  "comparisonNotes": "How this compares to the legitimate website (or N/A)",
  "topRisks": ["risk1", "risk2", "risk3"],
  "recommendation": "What the user should do"
}`;

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        timeout: 40000
      }
    );

    if (!response.data || !response.data.content || !response.data.content[0]) {
      throw new Error("Empty response from Anthropic API");
    }

    const rawText = response.data.content[0].text;
    console.log("[AI] Raw response snippet:", rawText.substring(0, 200));

    // Strip markdown code fences if present, then extract JSON
    const stripped = rawText.replace(/```json|```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      aiVerdict: parsed.verdict || "UNKNOWN",
      aiReasoning: parsed.reasoning || "No reasoning provided.",
      originalWebsite: parsed.originalWebsite || null,
      originalWebsiteUrl: parsed.originalWebsiteUrl || null,
      aiScore: typeof parsed.trustScore === "number" ? parsed.trustScore : null,
      comparisonNotes: parsed.comparisonNotes || null,
      topRisks: Array.isArray(parsed.topRisks) ? parsed.topRisks : [],
      recommendation: parsed.recommendation || null
    };
  } catch (err) {
    // Log the full Axios error response for easier debugging
    if (err.response) {
      console.error("[AI] API error status:", err.response.status);
      console.error("[AI] API error body:", JSON.stringify(err.response.data));
    } else {
      console.error("[AI] Error:", err.message);
    }
    return {
      aiVerdict: "ERROR",
      aiReasoning: `AI analysis unavailable: ${err.response?.data?.error?.message || err.message}`,
      originalWebsite: null,
      aiScore: null,
      comparisonNotes: null,
      topRisks: [],
      recommendation: "Manual review recommended. Check your ANTHROPIC_API_KEY in the .env file."
    };
  }
}

module.exports = { analyzeWithAI };
