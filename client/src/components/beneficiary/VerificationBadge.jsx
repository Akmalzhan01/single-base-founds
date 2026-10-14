import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getVerification, VERIFICATION_STATUSES, VERIFICATION_META } from '../../utils/verificationStatus';

// Текшерүү абалынын бейджи. editable болсо — басканда абалды тандоочу меню ачылат.
export default function VerificationBadge({ value, size = 'sm', editable = false, onChange }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  const v = getVerification(value);
  const Icon = v.icon;
  const lg = size === 'lg';

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const select = async (next) => {
    setOpen(false);
    if (next === v.value) return;
    setSaving(true);
    try { await onChange?.(next); } finally { setSaving(false); }
  };

  const badge = (
    <span
      className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${lg ? 'text-[12px] px-2.5 py-1.5 rounded-xl' : 'text-[11px] px-2 py-0.5 rounded-md'}`}
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}`, opacity: saving ? 0.6 : 1 }}
    >
      <Icon size={lg ? 14 : 12} strokeWidth={2.25} />
      {v.value}
      {editable && <ChevronDown size={lg ? 13 : 11} className="opacity-70" />}
    </span>
  );

  if (!editable) return badge;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={saving}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="cursor-pointer"
        title="Текшерүү абалын өзгөртүү"
      >
        {badge}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 z-30 w-48 rounded-xl p-1"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
        >
          {VERIFICATION_STATUSES.map((s) => {
            const meta = VERIFICATION_META[s];
            const SIcon = meta.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => { e.stopPropagation(); select(s); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-left cursor-pointer transition-colors"
                style={{ color: meta.color }}
                onMouseEnter={e => e.currentTarget.style.background = meta.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SIcon size={14} />
                <span className="flex-1 font-medium">{s}</span>
                {s === v.value && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
