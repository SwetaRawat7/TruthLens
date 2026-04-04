const { parse } = require("tldts");

// Common legitimate brands for typosquatting detection
const POPULAR_BRANDS = [
  "google", "gmail", "facebook", "instagram", "twitter", "youtube",
  "amazon", "netflix", "paypal", "apple", "microsoft", "linkedin",
  "github", "reddit", "wikipedia", "yahoo", "bing", "dropbox",
  "spotify", "twitch", "ebay", "walmart", "target", "chase",
  "bankofamerica", "wellsfargo", "citibank", "hdfc", "sbi", "icici",
  "flipkart", "myntra", "swiggy", "zomato", "paytm", "phonepe",
  "airbnb", "uber", "lyft", "doordash", "stripe", "shopify"
];

// Levenshtein distance for typosquatting detection
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function analyzeUrl(rawUrl) {
  const results = {
    flags: [],
    score: 100,
    details: {}
  };

  // Normalize URL
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    results.flags.push({ type: "error", message: "Invalid URL format", severity: "critical" });
    results.score = 0;
    return results;
  }

  const tldParsed = parse(url);
  const hostname = parsed.hostname.toLowerCase();
  const domain = tldParsed.domain || "";
  const domainName = tldParsed.domainWithoutSuffix || "";
  const subdomains = tldParsed.subdomain || "";
  const tld = tldParsed.publicSuffix || "";

  results.details.hostname = hostname;
  results.details.domain = domain;
  results.details.domainName = domainName;
  results.details.tld = tld;
  results.details.subdomains = subdomains;
  results.details.fullUrl = url;
  results.details.protocol = parsed.protocol;

  // 1. HTTP vs HTTPS
  if (parsed.protocol === "http:") {
    results.flags.push({
      type: "no_https",
      message: "Site uses HTTP (not secure). Sensitive data is unencrypted.",
      severity: "high"
    });
    results.score -= 15;
  }

  // 2. URL Length Check
  const urlLength = rawUrl.length;
  results.details.urlLength = urlLength;
  if (urlLength > 100) {
    results.flags.push({
      type: "long_url",
      message: `URL is unusually long (${urlLength} characters). Phishing URLs often hide the real destination.`,
      severity: "medium"
    });
    results.score -= 10;
  }
  if (urlLength > 200) {
    results.score -= 10;
  }

  // 3. Too many subdomains
  const subdomainParts = subdomains ? subdomains.split(".").filter(Boolean) : [];
  results.details.subdomainCount = subdomainParts.length;
  if (subdomainParts.length >= 3) {
    results.flags.push({
      type: "excessive_subdomains",
      message: `${subdomainParts.length} levels of subdomains detected (${subdomains}). Attackers use subdomains to mimic real brands.`,
      severity: "high"
    });
    results.score -= 20;
  } else if (subdomainParts.length === 2) {
    results.flags.push({
      type: "multiple_subdomains",
      message: `Multiple subdomains detected (${subdomains}). May be used to mislead users.`,
      severity: "medium"
    });
    results.score -= 8;
  }

  // 4. Random characters / entropy check
  const entropy = calculateEntropy(domainName);
  results.details.entropy = entropy.toFixed(2);
  if (entropy > 3.8) {
    results.flags.push({
      type: "high_entropy",
      message: `Domain name appears random or machine-generated (entropy: ${entropy.toFixed(2)}). DGA (Domain Generation Algorithm) domains are often malicious.`,
      severity: "high"
    });
    results.score -= 20;
  }

  // 5. Typosquatting detection
  let closestBrand = null;
  let closestDistance = Infinity;
  for (const brand of POPULAR_BRANDS) {
    const dist = levenshteinDistance(domainName.toLowerCase(), brand);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestBrand = brand;
    }
  }
  results.details.closestBrand = closestBrand;
  results.details.typosquattingDistance = closestDistance;

  if (closestDistance > 0 && closestDistance <= 2 && domainName !== closestBrand) {
    results.flags.push({
      type: "typosquatting",
      message: `Domain "${domainName}" is suspiciously similar to "${closestBrand}" (edit distance: ${closestDistance}). Possible typosquatting attack.`,
      severity: "critical",
      suggestedOriginal: closestBrand + ".com"
    });
    results.score -= 35;
  }

  // 6. Brand in subdomain but not domain (e.g. paypal.login-secure.com)
  for (const brand of POPULAR_BRANDS) {
    if (subdomains.includes(brand) && !domainName.includes(brand)) {
      results.flags.push({
        type: "brand_in_subdomain",
        message: `"${brand}" appears in subdomain but not in the main domain. Classic phishing trick.`,
        severity: "critical"
      });
      results.score -= 40;
      break;
    }
  }

  // 7. Suspicious TLD
  const suspiciousTlds = ["xyz", "top", "click", "link", "online", "site", "live", "pw", "cc", "tk", "ml", "ga", "cf", "gq"];
  if (suspiciousTlds.includes(tld)) {
    results.flags.push({
      type: "suspicious_tld",
      message: `TLD ".${tld}" is commonly associated with free/cheap domains used in phishing campaigns.`,
      severity: "medium"
    });
    results.score -= 10;
  }

  // 8. IP address as hostname
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    results.flags.push({
      type: "ip_as_domain",
      message: "URL uses a raw IP address instead of a domain name. Legitimate websites rarely do this.",
      severity: "critical"
    });
    results.score -= 30;
  }

  // 9. URL contains suspicious keywords
  const suspiciousKeywords = ["login", "verify", "secure", "account", "update", "confirm", "banking", "signin", "password", "credential", "authenticate", "wallet", "recover"];
  const foundKeywords = suspiciousKeywords.filter(kw => url.toLowerCase().includes(kw));
  if (foundKeywords.length >= 2) {
    results.flags.push({
      type: "suspicious_keywords",
      message: `URL contains multiple phishing-related keywords: ${foundKeywords.join(", ")}`,
      severity: "medium"
    });
    results.score -= 10;
  }

  // 10. URL has @ symbol (tricks browser)
  if (url.includes("@")) {
    results.flags.push({
      type: "at_symbol",
      message: 'URL contains "@" symbol. Browsers ignore everything before "@", used to disguise real destination.',
      severity: "critical"
    });
    results.score -= 30;
  }

  // 11. Excessive hyphens in domain
  const hyphenCount = (domainName.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    results.flags.push({
      type: "excessive_hyphens",
      message: `Domain contains ${hyphenCount} hyphens. Phishing domains often use hyphens to string keywords together.`,
      severity: "medium"
    });
    results.score -= 10;
  }

  // 12. Numeric characters in domain
  const numericMatches = domainName.match(/\d/g) || [];
  if (numericMatches.length > 3) {
    results.flags.push({
      type: "numeric_domain",
      message: `Domain contains many numeric characters (${numericMatches.length}). May indicate a generated or suspicious domain.`,
      severity: "low"
    });
    results.score -= 5;
  }

  results.score = Math.max(0, Math.min(100, results.score));
  return results;
}

function calculateEntropy(str) {
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / len;
    return sum + p * Math.log2(p);
  }, 0);
}

module.exports = { analyzeUrl, POPULAR_BRANDS };
