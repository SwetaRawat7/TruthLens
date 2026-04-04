function InfoCard({ data = {} }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold">AI Analysis</h2>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-bold">AI Analysis</h2>
      <pre className="text-sm overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default InfoCard;