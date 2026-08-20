import { Check } from 'lucide-react';

/**
 * Бир нече вариант тандоочу chip (pill) тизмеси.
 * value — тандалган маанилердин массиви, onChange(нов массив) кайтарат.
 */
export default function ChipSelect({ label, options = [], value = [], onChange, error, hint }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (v) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={active}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer select-none"
              style={{
                background: active ? '#10b981' : '#fff',
                color: active ? '#fff' : '#64748b',
                border: `1px solid ${active ? '#10b981' : '#e2e8f0'}`,
                boxShadow: active ? '0 1px 4px rgba(16,185,129,0.28)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.color = '#10b981';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {active && <Check size={12} strokeWidth={3} />}
              {opt.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <span className="text-[11px] text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-slate-300">{hint}</span>
      ) : null}
    </div>
  );
}
