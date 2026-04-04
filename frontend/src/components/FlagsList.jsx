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
      <h2 className="font-bold">Flags</h2>
      <ul className="list-disc ml-5">
        {flags.map((flag, index) => (
          <li key={index}>{flag}</li>
        ))}
      </ul>
    </div>
  );
}

export default FlagsList;