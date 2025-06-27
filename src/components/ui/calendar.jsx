export function Calendar({ selected, onSelect, className = "" }) {
  return (
    <input
      type="date"
      className={`w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={selected.toISOString().split("T")[0]}
      onChange={(e) => onSelect(new Date(e.target.value))}
    />
  );
} 