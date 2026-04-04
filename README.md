# 🛡️ TRUTHLENS AI — AI-Powered Fraud Detection

A full-stack SaaS tool that analyzes URLs for fraud, phishing, and typosquatting using multi-layer heuristic checks + Claude AI.

---

## 🧠 What It Detects

| Check | Description |
|---|---|
| 🔤 URL Structure | Typosquatting, excessive subdomains, long URLs, IP-as-domain, suspicious TLDs |
| 📋 WHOIS / Domain Age | Registration date, how old the domain is (new = risky) |
| 🌐 DNS Resolution | Whether the domain actually resolves to an IP |
| 📄 Website Content | Reads the page, checks for login forms, credential harvesting, suspicious content |
| 🤖 AI Analysis | Claude AI synthesizes all signals, compares to legitimate site, explains reasoning |
| 🎯 Trust Score | 0–100 score with verdict: LIKELY SAFE / SUSPICIOUS / HIGH RISK |

---

## 📁 Project Structure

```
url-guardian/
├── backend/
│   ├── server.js              # Express API server
│   ├── package.json
│   ├── .env.example           # Copy this to .env
│   └── utils/
│       ├── urlAnalyzer.js     # URL heuristics (typosquatting, entropy, etc.)
│       ├── domainChecker.js   # WHOIS + DNS checks
│       ├── contentAnalyzer.js # Website fetching + content analysis
│       └── aiAnalyzer.js      # Claude AI integration
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx            # Main UI
        ├── index.css          # Global styles
        ├── main.jsx
        └── components/
            ├── TrustScore.jsx # Circular gauge
            ├── FlagsList.jsx  # Security flag list
            └── InfoCard.jsx   # Collapsible info panels
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+ installed
- npm v9+ installed
- VS Code (recommended)

---

### Step 1 — Get API Keys

#### Required: Anthropic API Key (for AI analysis)
1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

#### Optional: WhoisXML API Key (for better WHOIS data)
1. Go to https://whois.whoisxmlapi.com
2. Sign up for a free account (500 free queries/month)
3. Go to **My Products** → copy your API key
> If you skip this, the app uses free RDAP fallback (less reliable)

---

### Step 2 — Set Up Backend

Open a terminal in VS Code (`Ctrl+`\``) and run:

```bash
# Navigate to backend
cd url-guardian/backend

# Install dependencies
npm install

# Copy .env file
cp .env.example .env
```

Now open `.env` in VS Code and fill in your keys:
```env
PORT=5000
ANTHROPIC_API_KEY=sk-ant-your-key-here
WHOISXML_API_KEY=your-whoisxml-key-here
```

Start the backend:
```bash
npm run dev
```

You should see:
```
🛡️  TRUTHLENS AI Backend running on http://localhost:5000
   AI Analysis: ✅ Enabled
   WHOIS API:   ✅ Enabled
```

---

### Step 3 — Set Up Frontend

Open a **second terminal** in VS Code:

```bash
# Navigate to frontend
cd url-guardian/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

---

### Step 4 — Open the App

Go to: **http://localhost:3000**

The frontend proxies `/api` requests to the backend at port 5000 automatically.

---

## 🧪 Test URLs to Try

| URL | Expected Result |
|---|---|
| `google.com` | ✅ LIKELY SAFE |
| `github.com` | ✅ LIKELY SAFE |
| `paypa1-secure-login.com` | 🚫 HIGH RISK (typosquatting) |
| `arnazon-deals.tk` | 🚫 HIGH RISK |
| `secure-bankofamerica-login.xyz` | 🚫 HIGH RISK |
| `login.paypal.com` | ✅ SAFE (legitimate PayPal subdomain) |
| `paypal.login-secure-verify.com` | 🚫 HIGH RISK (brand in subdomain) |

---

## ⚙️ Configuration

Edit `backend/.env` to configure:

```env
PORT=5000                    # Backend port
ANTHROPIC_API_KEY=...        # Required for AI analysis
WHOISXML_API_KEY=...         # Optional, improves WHOIS accuracy
```

---

## 🔌 API Reference

### `POST /api/analyze`
Analyze a URL for fraud indicators.

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "success": true,
  "analyzedUrl": "https://example.com",
  "trustScore": 82,
  "verdict": "LIKELY SAFE",
  "verdictColor": "green",
  "elapsedMs": 4200,
  "urlDetails": { ... },
  "domainInfo": { ... },
  "dnsInfo": { ... },
  "websiteInfo": { ... },
  "aiAnalysis": {
    "verdict": "LEGITIMATE",
    "reasoning": "...",
    "originalWebsite": "example.com",
    "comparisonNotes": "...",
    "topRisks": [...],
    "recommendation": "..."
  },
  "flags": [
    {
      "type": "typosquatting",
      "message": "...",
      "severity": "critical"
    }
  ],
  "flagCount": 3,
  "criticalFlagCount": 1
}
```

### `GET /api/health`
Returns server status and which features are enabled.

---

## 🏗️ Build for Production

### Backend
```bash
cd backend
npm start   # Uses node directly, no nodemon
```

### Frontend
```bash
cd frontend
npm run build   # Builds to frontend/dist/
npm run preview # Preview the build
```

For production, serve the `frontend/dist` folder via nginx or any static host, and deploy `backend/` to a Node.js server (Render, Railway, Fly.io, etc.).

---

## 🔒 Rate Limiting

The API is rate-limited to **30 requests per 15 minutes** per IP to prevent abuse. Adjust in `backend/server.js`:

```js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Change this
});
```

---

## 📦 Dependencies

### Backend
- `express` — Web framework
- `axios` — HTTP requests (for fetching websites + AI API)
- `cheerio` — HTML parsing (like jQuery for Node.js)
- `tldts` — TLD/domain parsing
- `cors`, `helmet` — Security middleware
- `express-rate-limit` — Rate limiting
- `dotenv` — Environment variables

### Frontend
- `react` + `react-dom` — UI framework
- `axios` — API calls
- `vite` — Build tool

---

## 🛠️ Troubleshooting

**"CORS error" in browser console**
→ Make sure the backend is running on port 5000

**"AI analysis failed"**
→ Check your `ANTHROPIC_API_KEY` in `.env`

**"WHOIS unknown" for all domains**
→ Add a `WHOISXML_API_KEY` or wait — RDAP (free fallback) can be rate-limited

**Website shows as inaccessible even though it works in browser**
→ Some sites block server-side requests (Cloudflare, etc.). This is noted in the analysis.

**Port already in use**
→ Change `PORT=5001` in `.env` and update `vite.config.js` proxy target accordingly
