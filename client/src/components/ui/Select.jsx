export default function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all text-slate-700 cursor-pointer ${className}`}
        style={{ background: '#fff', border: error ? '1px solid #f87171' : '1px solid #e2e8f0' }}
        onFocus={e => e.target.style.borderColor = '#10b981'}
        onBlur={e => e.target.style.borderColor = error ? '#f87171' : '#e2e8f0'}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
