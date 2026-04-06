export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all text-slate-700 placeholder:text-slate-300 ${className}`}
        style={{ background: '#fff', border: error ? '1px solid #f87171' : '1px solid #e2e8f0' }}
        onFocus={e => e.target.style.borderColor = error ? '#f87171' : '#10b981'}
        onBlur={e => e.target.style.borderColor = error ? '#f87171' : '#e2e8f0'}
        {...props}
      />
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
