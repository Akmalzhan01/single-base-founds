const variants = {
  primary: 'text-white',
  secondary: 'text-slate-700 border border-slate-200 bg-white hover:bg-slate-50',
  danger: 'text-white',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const variantStyles = {
  primary: { background: '#10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' },
  secondary: {},
  danger: { background: '#ef4444', boxShadow: '0 2px 6px rgba(239,68,68,0.2)' },
  ghost: {},
};

const sizes = {
  sm: 'px-3 py-1.5 text-[12px] font-medium',
  md: 'px-4 py-2 text-[13px] font-medium',
  lg: 'px-5 py-2.5 text-[13px] font-semibold',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      style={variantStyles[variant]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
