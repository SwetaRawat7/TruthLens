const dns = require("dns").promises;
const axios = require("axios");

async function checkDomainRegistration(domain) {
  const result = {
    registered: false,
    registrationDate: null,
    expiryDate: null,
    registrar: null,
    ageInDays: null,
    flags: [],
    score: 0
  };

  try {
    const apiKey = process.env.WHOISXML_API_KEY;

    if (apiKey && apiKey !== "your_whoisxml_api_key_here") {
      const response = await axios.get(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`,
        { timeout: 10000 }
      );

      const data = response.data?.WhoisRecord;

      if (data) {
        result.registered = true;
        result.registrar = data.registrarName || "Unknown";

        const createdDate = data.createdDate || data.registryData?.createdDate;
        const expiresDate = data.expiresDate || data.registryData?.expiresDate;

        if (createdDate) {
          result.registrationDate = new Date(createdDate).toISOString();
          const ageDays = Math.floor(
            (Date.now() - new Date(createdDate)) / (1000 * 60 * 60 * 24)
          );
          result.ageInDays = ageDays;

          if (ageDays < 30) {
            result.flags.push({
              type: "very_new_domain",
              message: `Domain registered only ${ageDays} day(s) ago.`,
              severity: "critical"
            });
            result.score -= 40;
          } else if (ageDays < 180) {
            result.flags.push({
              type: "new_domain",
              message: `Domain is ${ageDays} days old.`,
              severity: "high"
            });
            result.score -= 20;
          } else if (ageDays < 365) {
            result.flags.push({
              type: "young_domain",
              message: `Domain is less than 1 year old.`,
              severity: "medium"
            });
            result.score -= 10;
          } else {
            result.score += 10; // trusted older domain
          }
        }

        if (expiresDate) {
          result.expiryDate = new Date(expiresDate).toISOString();
        }
      }
    } else {
      // RDAP fallback
      const cleanDomain = domain.replace(/^www\./, "");

      try {
        const rdapResponse = await axios.get(
          `https://rdap.org/domain/${cleanDomain}`,
          { timeout: 8000 }
        );

        const rdapData = rdapResponse.data;
        result.registered = true;

        const events = rdapData.events || [];
        const registration = events.find(e => e.eventAction === "registration");
        const expiration = events.find(e => e.eventAction === "expiration");

        if (registration?.eventDate) {
          result.registrationDate = registration.eventDate;

          const ageDays = Math.floor(
            (Date.now() - new Date(registration.eventDate)) /
              (1000 * 60 * 60 * 24)
          );

          result.ageInDays = ageDays;

          if (ageDays < 30) {
            result.flags.push({
              type: "very_new_domain",
              message: `Domain registered only ${ageDays} day(s) ago.`,
              severity: "critical"
            });
            result.score -= 40;
          } else if (ageDays < 180) {
            result.flags.push({
              type: "new_domain",
              message: `Domain is ${ageDays} days old.`,
              severity: "high"
            });
            result.score -= 20;
          } else if (ageDays < 365) {
            result.flags.push({
              type: "young_domain",
              message: `Domain is less than 1 year old.`,
              severity: "medium"
            });
            result.score -= 10;
          } else {
            result.score += 10;
          }
        }

        if (expiration?.eventDate) {
          result.expiryDate = expiration.eventDate;
        }

        const entities = rdapData.entities || [];
        const registrar = entities.find(e =>
          e.roles?.includes("registrar")
        );

        if (registrar) {
          result.registrar =
            registrar.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3] ||
            "Unknown";
        }
      } catch (rdapErr) {
        result.registered = null;

        result.flags.push({
          type: "whois_unavailable",
          message: "WHOIS/RDAP data unavailable.",
          severity: "low"
        });
      }
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

async function checkDnsResolution(hostname) {
  const result = {
    resolves: false,
    ipAddresses: [],
    flags: [],
    score: 0
  };

  try {
    const addresses = await dns.resolve4(hostname);

    result.resolves = true;
    result.ipAddresses = addresses;

    if (addresses.length > 10) {
      result.flags.push({
        type: "many_ips",
        message: `Domain resolves to many IPs (${addresses.length}).`,
        severity: "medium"
      });
      result.score -= 10;
    } else {
      result.score += 5; // normal healthy DNS
    }
  } catch (err) {
    result.resolves = false;

    result.flags.push({
      type: "no_dns",
      message: "Domain does not resolve via DNS.",
      severity: "critical"
    });

    result.score -= 50;
  }

  return result;
}

module.exports = { checkDomainRegistration, checkDnsResolution };