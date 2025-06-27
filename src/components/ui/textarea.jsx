export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      rows={4}
      {...props}
    />
  );
} 
