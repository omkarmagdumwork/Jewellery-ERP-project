export default function Spinner({ className = "h-6 w-6" }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-amber-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// Centered loader for whole pages
export function PageLoader() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="h-10 w-10" />
    </div>
  );
}

// Button that shows a small spinner while saving
export function LoadingButton({ loading, children, className = "", ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50 ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 border-2 border-white border-t-transparent" />}
      {children}
    </button>
  );
}
