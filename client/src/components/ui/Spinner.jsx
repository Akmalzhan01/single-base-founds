export default function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' };
  return (
    <div className="flex items-center justify-center py-16">
      <svg className={`animate-spin ${s[size]}`} viewBox="0 0 24 24" fill="none" style={{ color: '#10b981' }}>
        <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
}
