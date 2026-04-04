function FlagsList({ flags = [] }) {
  if (!Array.isArray(flags) || flags.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold">Flags</h2>
        <p>No issues detected</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-bold mb-2">Flags</h2>

      <div className="space-y-2">
        {flags.map((flag, index) => (
          <div
            key={index}
            className="p-3 border rounded-lg bg-gray-50"
          >
            <p className="font-semibold">
              {flag.type || "Unknown"}
            </p>

            <p className="text-sm text-gray-600">
              {flag.message || "No description"}
            </p>

            <p className="text-xs mt-1">
              Severity:{" "}
              <span className="font-bold">
                {flag.severity || "N/A"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FlagsList;

