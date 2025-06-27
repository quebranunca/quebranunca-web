export function Button({ children, variant = "default", className = "", ...props }) {
  const base = "rounded-xl px-4 py-2 font-semibold text-sm transition";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
} 
