import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center py-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[13px] text-slate-400 px-3 font-medium tabular-nums">
        {page} / {pages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="p-2 rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
