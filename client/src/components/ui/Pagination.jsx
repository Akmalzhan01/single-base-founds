import { ChevronLeft, ChevronRight } from 'lucide-react';

const LIMITS = [10, 20, 50, 100];

// 1 … 4 5 [6] 7 8 … 20 түрүндөгү барак номерлери
function pageItems(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) items.push('…');
  for (let p = from; p <= to; p++) items.push(p);
  if (to < pages - 1) items.push('…');
  items.push(pages);
  return items;
}

// Барак алмашканда башына сыдырылат. Ички барактарда <main> сыдырылат,
// ачык блогдо — бүт терезе, ошондуктан экөө тең.
const scrollToTop = () => {
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const btnStyle = { background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' };

/**
 * page, pages — азыркы барак жана жалпы барак саны.
 * total, limit — берилсе «1–20 / 134» маалыматы чыгат.
 * onLimitChange — берилсе бир барактагы сан тандалат.
 */
export default function Pagination({ page, pages, onChange, total, limit, onLimitChange }) {
  const hasLimit = !!onLimitChange;
  if (!total && pages <= 1) return null;
  if (pages <= 1 && !(hasLimit && total > LIMITS[0])) return null;

  const go = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onChange(p);
    scrollToTop();
  };

  const from = total ? (page - 1) * limit + 1 : 0;
  const to = total ? Math.min(page * limit, total) : 0;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2">
      <span className="text-[12px] text-slate-400 tabular-nums min-w-24">
        {total != null && limit ? `${from}–${to} / ${total}` : ''}
      </span>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={btnStyle}
            aria-label="Мурунку барак"
          >
            <ChevronLeft size={14} />
          </button>

          {pageItems(page, pages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="w-8 text-center text-[13px] text-slate-300 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => go(p)}
                className="min-w-8 h-8 px-2 rounded-lg text-[13px] font-medium tabular-nums cursor-pointer transition-all"
                style={p === page
                  ? { background: '#10b981', color: '#fff', border: '1px solid #10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }
                  : btnStyle}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => go(page + 1)}
            disabled={page >= pages}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={btnStyle}
            aria-label="Кийинки барак"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="min-w-24 flex justify-end">
        {hasLimit && (
          <select
            value={limit}
            onChange={(e) => { onLimitChange(Number(e.target.value)); scrollToTop(); }}
            className="rounded-lg px-2 py-1.5 text-[12px] outline-none cursor-pointer"
            style={{ ...btnStyle, color: '#475569' }}
            title="Бир барактагы саны"
          >
            {LIMITS.map((l) => <option key={l} value={l}>{l} / барак</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
