import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ArrowUp, ArrowDown, Archive, ArchiveRestore, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../context/CategoriesContext';
import { CATEGORY_GROUPS, CATEGORY_COLORS } from '../../utils/categories';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const iconBtn = 'p-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed';

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
        style={{ background: CATEGORY_COLORS[value] || CATEGORY_COLORS.gray, boxShadow: '0 0 0 2px #fff, 0 0 0 3px #e2e8f0' }}
        title="Түсүн тандоо"
      />
      {open && (
        <div
          className="absolute left-0 top-8 z-30 p-2 rounded-xl grid grid-cols-5 gap-1.5"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
        >
          {Object.entries(CATEGORY_COLORS).map(([key, hex]) => (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setOpen(false); }}
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{ background: hex }}
              title={key}
            >
              {key === value && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, isFirst, isLast, onUpdate, onMove, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) { setEditing(false); setName(cat.name); return; }
    const ok = await onUpdate(cat, { name: trimmed });
    if (ok) setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 group"
      style={{ borderBottom: '1px solid #f8fafc', opacity: cat.isActive ? 1 : 0.55 }}
    >
      <ColorPicker value={cat.color} onChange={(color) => onUpdate(cat, { color })} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setName(cat.name); } }}
              className="flex-1 rounded-lg px-2.5 py-1 text-[13px] outline-none"
              style={{ border: '1px solid #10b981' }}
            />
            <button onClick={save} className={iconBtn} style={{ color: '#10b981' }} title="Сактоо"><Check size={14} /></button>
            <button onClick={() => { setEditing(false); setName(cat.name); }} className={iconBtn} style={{ color: '#94a3b8' }} title="Жокко чыгаруу"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <Badge color={cat.color}>{cat.name}</Badge>
            {!cat.isActive && <span className="text-[11px] text-slate-400">архивде</span>}
          </div>
        )}
      </div>

      <span className="text-[12px] text-slate-400 shrink-0 w-20 text-right" title="Канча жазууда колдонулат">
        {cat.usage ? `${cat.usage} жазуу` : 'колдонулбайт'}
      </span>

      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={() => onMove(cat, -1)} disabled={isFirst} className={`${iconBtn} text-slate-400 hover:bg-slate-100`} title="Өйдө"><ArrowUp size={14} /></button>
        <button onClick={() => onMove(cat, 1)} disabled={isLast} className={`${iconBtn} text-slate-400 hover:bg-slate-100`} title="Төмөн"><ArrowDown size={14} /></button>
        <button onClick={() => setEditing(true)} className={`${iconBtn} text-slate-400 hover:bg-slate-100`} title="Атын өзгөртүү"><Pencil size={14} /></button>
        <button
          onClick={() => onUpdate(cat, { isActive: !cat.isActive })}
          className={`${iconBtn} text-slate-400 hover:bg-slate-100`}
          title={cat.isActive ? 'Архивге жылдыруу (формаларда чыкпайт)' : 'Архивден кайтаруу'}
        >
          {cat.isActive ? <Archive size={14} /> : <ArchiveRestore size={14} />}
        </button>
        <button
          onClick={() => onDelete(cat)}
          disabled={cat.usage > 0}
          className={`${iconBtn} hover:bg-red-50`}
          style={{ color: '#ef4444' }}
          title={cat.usage > 0 ? 'Колдонулуп жаткан категорияны өчүрүүгө болбойт — архивге жылдырыңыз' : 'Өчүрүү'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const { user } = useAuth();
  const { reload: reloadContext } = useCategories();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(CATEGORY_GROUPS[0].key);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/categories', { params: { usage: 1 } });
      setData(res.data.data);
    } catch {
      toast.error('Маалымат жүктөлгөн жок');
    } finally {
      setLoading(false);
    }
  };

  // Өзгөртүүдөн кийин бул барак да, формалар/чыпкалар колдонгон контекст да жаңыланат
  const refresh = async () => { await load(); reloadContext(); };

  useEffect(() => { load(); }, []);

  if (!user?.isSuperadmin) {
    return <div className="py-24 text-center text-[13px] text-slate-400">Бул барак суперадмин үчүн гана</div>;
  }
  if (loading) return <Spinner />;

  const groupMeta = CATEGORY_GROUPS.find((g) => g.key === group);
  const items = data
    .filter((c) => c.group === group)
    .sort((a, b) => (b.isActive - a.isActive) || (a.order - b.order));
  const activeItems = items.filter((c) => c.isActive);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/categories', { group, name: newName.trim(), color: newColor });
      setNewName('');
      toast.success('Категория кошулду');
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (cat, patch) => {
    try {
      await api.put(`/categories/${cat._id}`, patch);
      if (patch.name) toast.success('Аты өзгөрдү — бардык жазуулар жаңыланды');
      await refresh();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
      return false;
    }
  };

  const handleMove = async (cat, dir) => {
    const list = cat.isActive ? activeItems : items.filter((c) => !c.isActive);
    const idx = list.findIndex((c) => c._id === cat._id);
    const swapWith = list[idx + dir];
    if (!swapWith) return;
    const ordered = [...activeItems, ...items.filter((c) => !c.isActive)];
    const a = ordered.indexOf(cat);
    const b = ordered.indexOf(swapWith);
    [ordered[a], ordered[b]] = [ordered[b], ordered[a]];
    // Оптимисттик жаңылоо — тизме дароо которулат
    setData((prev) => prev.map((c) => {
      const i = ordered.findIndex((o) => o._id === c._id);
      return i === -1 ? c : { ...c, order: i };
    }));
    try {
      await api.put('/categories/reorder', { group, ids: ordered.map((c) => c._id) });
      reloadContext();
    } catch {
      toast.error('Иретин сактоодо ката кетти');
      load();
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`«${cat.name}» категориясын өчүрөсүзбү?`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      toast.success('Өчүрүлдү');
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Категориялар</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          Муктаждардын формаларында жана чыпкаларында чыгуучу тизмелерди ушул жерден башкарыңыз
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_GROUPS.map((g) => {
          const active = g.key === group;
          const count = data.filter((c) => c.group === g.key && c.isActive).length;
          return (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
              style={active
                ? { background: '#10b981', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }
                : { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}
            >
              {g.label}
              <span
                className="text-[11px] font-semibold px-1.5 rounded-md"
                style={{ background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <Tags size={14} className="text-slate-400" />
          <p className="text-[12px] text-slate-500">{groupMeta.hint}</p>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Жаңы категория: ${groupMeta.label.toLowerCase()}`}
            className="flex-1 rounded-xl px-3.5 py-2 text-[13px] outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#10b981' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Кошуу
          </button>
        </form>

        {items.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-slate-300">Категориялар жок</div>
        ) : (
          items.map((cat) => {
            const siblings = cat.isActive ? activeItems : items.filter((c) => !c.isActive);
            const idx = siblings.indexOf(cat);
            return (
              <CategoryRow
                key={cat._id}
                cat={cat}
                isFirst={idx === 0}
                isLast={idx === siblings.length - 1}
                onUpdate={handleUpdate}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>

      <p className="text-[12px] text-slate-400 leading-relaxed">
        Атын өзгөртсөңүз — ушул категория жазылган бардык муктаждар (жана жардам жазуулары) автоматтык түрдө жаңыланат.
        Колдонулуп жаткан категорияны өчүрүүгө болбойт: аны архивге жылдырыңыз — жаңы формаларда чыкпайт, эски жазууларда сакталат.
      </p>
    </div>
  );
}
