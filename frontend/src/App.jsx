import { useState } from "react";
import axios from "axios";

// ✅ TEMP: Removed components to fix build error

const API_BASE = "https://truthlens-backend-sue6.onrender.com";

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
        `${API_BASE}/api/analyze`,
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

      {/* ✅ TEMP RESULT OUTPUT (SAFE) */}
      {result && (
        <div className="w-full max-w-xl mt-6 bg-white p-4 rounded-xl shadow">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;