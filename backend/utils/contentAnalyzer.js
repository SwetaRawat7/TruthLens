const axios = require("axios");
const cheerio = require("cheerio");

async function fetchWebsiteContent(url) {
  const result = {
    accessible: false,
    statusCode: null,
    title: null,
    description: null,
    bodyText: null,
    links: [],
    forms: [],
    hasPasswordField: false,
    hasLoginForm: false,
    hasSocialLinks: false,
    flags: [],
    score: 0,
    screenshotUrl: null,
    favicon: null,
    contentSummary: null
  };

  try {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const response = await axios.get(normalizedUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 600
    });

    result.accessible = response.status < 400;
    result.statusCode = response.status;

    if (response.status >= 400) {
      result.flags.push({
        type: "http_error",
        message: `Website returned HTTP ${response.status}. The page may not exist or is blocked.`,
        severity: "high"
      });
      result.score -= 30;
      return result;
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // Basic meta
    result.title = $("title").text().trim().substring(0, 200) || null;
    result.description = $('meta[name="description"]').attr("content")?.substring(0, 300) || null;
    result.favicon = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr("href") || null;

    // Extract visible text (limited)
    $("script, style, noscript, header, footer, nav").remove();
    result.bodyText = $("body").text().replace(/\s+/g, " ").trim().substring(0, 2000);

    // Forms analysis
    $("form").each((_, form) => {
      const formData = {
        action: $(form).attr("action") || "",
        method: $(form).attr("method") || "get",
        inputs: []
      };

      $(form).find("input").each((_, input) => {
        const inputType = $(input).attr("type") || "text";
        formData.inputs.push(inputType);
        if (inputType === "password") result.hasPasswordField = true;
      });

      result.forms.push(formData);
    });

    // Check for login forms
    const pageText = result.bodyText.toLowerCase();
    result.hasLoginForm = result.hasPasswordField ||
      (pageText.includes("sign in") || pageText.includes("log in") || pageText.includes("login"));

    // Social media links
    const socialDomains = ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "youtube.com"];
    $("a[href]").each((_, a) => {
      const href = $(a).attr("href") || "";
      if (socialDomains.some(sd => href.includes(sd))) result.hasSocialLinks = true;
      result.links.push(href);
    });

    // External form actions (data theft)
    result.forms.forEach(form => {
      if (form.action && !form.action.startsWith("/") && !form.action.startsWith("#")) {
        try {
          const formUrl = new URL(form.action);
          const targetUrl = new URL(normalizedUrl);
          if (formUrl.hostname !== targetUrl.hostname) {
            result.flags.push({
              type: "external_form_action",
              message: `Form submits data to external domain: ${formUrl.hostname}. This is a classic credential-stealing technique.`,
              severity: "critical"
            });
            result.score -= 40;
          }
        } catch (e) {}
      }
    });

    // Suspicious: login form + new domain = very risky
    if (result.hasLoginForm && result.hasPasswordField) {
      result.flags.push({
        type: "credential_collection",
        message: "Website collects credentials (has password field). Verify this is the legitimate site before entering any credentials.",
        severity: "high"
      });
      result.score -= 15;
    }

    // Content checks
    const suspiciousContent = [
      { keyword: "enter your bank", message: "Page asks for banking credentials" },
      { keyword: "verify your account", message: "Page requests account verification" },
      { keyword: "your account has been suspended", message: "Urgency tactic: claims account suspension" },
      { keyword: "click here to claim", message: "Potential prize/scam language detected" },
      { keyword: "you have been selected", message: "Scam selection language detected" },
      { keyword: "bitcoin", message: "Cryptocurrency-related content" },
      { keyword: "wire transfer", message: "Wire transfer requests detected" }
    ];

    suspiciousContent.forEach(({ keyword, message }) => {
      if (pageText.includes(keyword)) {
        result.flags.push({
          type: "suspicious_content",
          message: `Content warning: "${message}"`,
          severity: "high"
        });
        result.score -= 15;
      }
    });

    // Little or no content
    if (result.bodyText.length < 100) {
      result.flags.push({
        type: "minimal_content",
        message: "Website has very little visible content. May be a placeholder, parked, or hidden phishing page.",
        severity: "medium"
      });
      result.score -= 10;
    }

    // Missing social links for a brand site
    if (!result.hasSocialLinks) {
      result.flags.push({
        type: "no_social_links",
        message: "No social media links found. Legitimate businesses typically link to their social profiles.",
        severity: "low"
      });
      result.score -= 3;
    }

    // Build content summary for AI
    result.contentSummary = {
      title: result.title,
      description: result.description,
      bodyTextSnippet: result.bodyText.substring(0, 800),
      formCount: result.forms.length,
      hasPasswordField: result.hasPasswordField,
      hasLoginForm: result.hasLoginForm,
      linksCount: result.links.length
    };

  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      result.flags.push({
        type: "unreachable",
        message: "Cannot connect to website. It may not exist, is offline, or is blocking automated checks.",
        severity: "critical"
      });
      result.score -= 50;
    } else if (err.code === "ETIMEDOUT") {
      result.flags.push({
        type: "timeout",
        message: "Website timed out. It may be a parked/fake domain or very slow server.",
        severity: "medium"
      });
      result.score -= 20;
    } else {
      result.flags.push({
        type: "fetch_error",
        message: `Could not load website: ${err.message}`,
        severity: "high"
      });
      result.score -= 25;
    }
    result.accessible = false;
  }

  return result;
}

module.exports = { fetchWebsiteContent };
