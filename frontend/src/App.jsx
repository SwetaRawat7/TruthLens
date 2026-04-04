import { useState } from "react";
import axios from "axios";
import TrustScore from "./components/TrustScore";
import FlagsList from "./components/FlagsList";
import InfoCard from "./components/InfoCard";

// ✅ Correct backend URL
const API_BASE = "https://truthlens-backend-sue6.onrender.com/api";

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
        `${API_BASE}/analyze`,
        { url },
        {
          timeout: 75000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      if (err.response) {
        setError(err.response.data?.error || "Server error");
      } else if (err.request) {
        setError("No response from server (backend may be sleeping 😴)");
      } else {
        setError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 TruthLens AI</h1>

      <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-md">
        <input
          type="text"
          placeholder="Enter URL to analyze..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
        />

        <button
          onClick={analyzeUrl}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze URL"}
        </button>

        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
      </div>

      {/* ✅ FIXED RESULT SECTION */}
      {result && (
        <div className="w-full max-w-xl mt-6 space-y-4">
          <TrustScore score={result.trustScore || 0} />
          <FlagsList flags={result.flags || []} />
          <InfoCard data={result.ai || {}} />
        </div>
      )}
    </div>
  );
}

export default App;