import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Clock, CheckCircle, ChevronRight, X, Send, Pencil, Search, MessageSquare, Calendar } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const STATUS_CONFIG = {
  open:        { label: 'Ачык',         color: '#ef4444', bg: '#fef2f2', icon: AlertTriangle },
  in_progress: { label: 'Иш үстүндө',   color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  resolved:    { label: 'Чечилди',       color: '#10b981', bg: '#f0fdf4', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Төмөн',   color: '#64748b', bg: '#f8fafc' },
  medium: { label: 'Орто',    color: '#f59e0b', bg: '#fffbeb' },
  high:   { label: 'Жогору',  color: '#ef4444', bg: '#fef2f2' },
};

const EMPTY_FORM = { title: '', description: '', address: '', region: '', district: '', phone: '', priority: 'medium', deadline: '' };

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Азыр';
  if (min < 60) return `${min} мин мурун`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} саат мурун`;
  const d = Math.floor(h / 24);
  return `${d} күн мурун`;
}

function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / 86400000);
  const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  if (diffDays < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#fef2f2', color: '#dc2626' }}>
      <Calendar size={9} /> {label} (өтүп кетти)
    </span>
  );
  if (diffDays <= 3) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#fffbeb', color: '#d97706' }}>
      <Calendar size={9} /> {label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#f0fdf4', color: '#16a34a' }}>
      <Calendar size={9} /> {label}
    </span>
  );
}

export default function Notices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updatingDetail, setUpdatingDetail] = useState(false);

  // Comment (without status change)
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterPriority) params.set('priority', filterPriority);
    if (search) params.set('search', search);
    api.get(`/notices?${params}`)
      .then(r => { setNotices(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, [filterStatus, filterPriority, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title) return toast.error('Аталыш керек');
    setSaving(true);
    try {
      const res = await api.post('/notices', form);
      setNotices(p => [res.data.data, ...p]);
      setTotal(t => t + 1);
      setCreateModal(false);
      setForm(EMPTY_FORM);
      toast.success('Маалымат жарыяланды');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id) => {
    setDetail(null);
    setDetailLoading(true);
    setNewStatus('');
    setComment('');
    setCommentText('');
    setEditing(false);
    try {
      const res = await api.get(`/notices/${id}`);
      setDetail(res.data.data);
    } catch {
      toast.error('Жүктөлгөн жок');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return toast.error('Статус тандаңыз');
    setChangingStatus(true);
    try {
      const res = await api.patch(`/notices/${detail._id}/status`, { status: newStatus, comment });
      setDetail(res.data.data);
      setNotices(p => p.map(n => n._id === detail._id ? { ...n, status: newStatus } : n));
      setNewStatus('');
      setComment('');
      toast.success('Статус өзгөртүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/notices/${detail._id}/comment`, { comment: commentText });
      setDetail(res.data.data);
      setCommentText('');
      toast.success('Комментарий кошулду');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setAddingComment(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      title: detail.title,
      description: detail.description || '',
      address: detail.address || '',
      phone: detail.phone || '',
      region: detail.region || '',
      district: detail.district || '',
      priority: detail.priority,
      deadline: detail.deadline ? new Date(detail.deadline).toISOString().split('T')[0] : '',
    });
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!editForm.title) return toast.error('Аталыш керек');
    setUpdatingDetail(true);
    try {
      const res = await api.put(`/notices/${detail._id}`, editForm);
      setDetail(d => ({ ...d, ...res.data.data }));
      setNotices(p => p.map(n => n._id === detail._id ? { ...n, ...res.data.data } : n));
      setEditing(false);
      toast.success('Өзгөртүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setUpdatingDetail(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Маалыматты өчүрөсүзбү?')) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices(p => p.filter(n => n._id !== id));
      setTotal(t => t - 1);
      if (detail?._id === id) setDetail(null);
      toast.success('Өчүрүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Маалымат тактасы</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Фонддор аралык координация · жалпы {total} маалымат</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setCreateModal(true); }}>
          <Plus size={14} strokeWidth={2.5} /> Жаңы маалымат
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Аталыш, сүрөттөмө же дарек боюнча издөө..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none text-slate-700 placeholder:text-slate-300 transition-all"
            style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status + Priority filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {['', 'open', 'in_progress', 'resolved'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
              style={filterStatus === s
                ? { background: '#0d0d18', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {s === '' ? 'Баары' : STATUS_CONFIG[s].label}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {['', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
              style={filterPriority === p
                ? { background: '#0d0d18', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {p === '' ? 'Бардык приоритет' : PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? <Spinner /> : notices.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Маалымат жок</div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div
              key={n._id}
              className="rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
              style={cardStyle}
              onClick={() => openDetail(n._id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1 rounded-full shrink-0 self-stretch"
                  style={{ background: PRIORITY_CONFIG[n.priority]?.color || '#64748b', minHeight: 40 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-slate-800 leading-snug">{n.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <DeadlineBadge deadline={n.deadline} />
                      <PriorityBadge priority={n.priority} />
                      <StatusBadge status={n.status} />
                    </div>
                  </div>
                  {n.description && (
                    <p className="text-[12px] text-slate-400 mt-1 line-clamp-2">{n.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    {n.address && <span className="text-[11px] text-slate-400">📍 {n.address}</span>}
                    {n.region && <span className="text-[11px] text-slate-400">🗺 {n.region}{n.district ? `, ${n.district}` : ''}</span>}
                    {n.phone && <span className="text-[11px] font-medium" style={{ color: '#10b981' }}>📞 {n.phone}</span>}
                    {n.beneficiary && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        👤 {n.beneficiary.fullName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[11px] text-slate-300">
                      {n.createdByFoundation?.name || 'Белгисиз фонд'} · {timeAgo(n.createdAt)}
                    </span>
                    <ChevronRight size={13} className="text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Жаңы маалымат жарыялоо" size="md">
        <div className="space-y-4">
          <Input label="Аталыш *" value={form.title} onChange={set('title')} placeholder="Кыскача маалымат" />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Сүрөттөмө</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Кеңири маалымат, байланыш, кошумча маалымат..."
              className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-slate-700 resize-none placeholder:text-slate-300"
              style={{ background: '#fff', border: '1px solid #e2e8f0' }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Дарек" value={form.address} onChange={set('address')} placeholder="Кочо, үй номери" />
            <Input label="Телефон" value={form.phone} onChange={set('phone')} type="tel" placeholder="+996 ..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Аймак" value={form.region} onChange={set('region')} placeholder="Облус" />
            <Input label="Район" value={form.district} onChange={set('district')} placeholder="Район" />
          </div>
          <Input
            label="Мөөнөт (deadline)"
            value={form.deadline}
            onChange={set('deadline')}
            type="date"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Приоритет</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, priority: key }))}
                  className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
                  style={form.priority === key
                    ? { background: cfg.color, color: '#fff' }
                    : { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }
                  }
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Жокко чыгаруу</Button>
            <Button onClick={handleCreate} loading={saving}>Жарыялоо</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail || detailLoading} onClose={() => setDetail(null)} title="Маалымат" size="lg">
        {detailLoading ? (
          <Spinner />
        ) : detail ? (() => {
          const isOwner = user?.isSuperadmin || detail.createdByFoundation?._id === user?.foundation?._id;
          return (
          <div className="space-y-5">
            {/* Title + badges or edit form */}
            {editing ? (
              <div className="space-y-3 rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Input label="Аталыш *" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Сүрөттөмө</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-slate-700 resize-none placeholder:text-slate-300"
                    style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Дарек" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                  <Input label="Телефон" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Аймак" value={editForm.region} onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))} />
                  <Input label="Район" value={editForm.district} onChange={e => setEditForm(p => ({ ...p, district: e.target.value }))} />
                </div>
                <Input
                  label="Мөөнөт (deadline)"
                  value={editForm.deadline}
                  onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                  type="date"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Приоритет</label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setEditForm(p => ({ ...p, priority: key }))}
                        className="flex-1 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
                        style={editForm.priority === key ? { background: cfg.color, color: '#fff' } : { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                      >{cfg.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer" style={{ color: '#64748b', background: '#fff', border: '1px solid #e2e8f0' }}>Жокко чыгаруу</button>
                  <Button onClick={handleUpdate} loading={updatingDetail}>Сактоо</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-bold text-slate-800 leading-snug">{detail.title}</h3>
                  {detail.deadline && <div className="mt-1"><DeadlineBadge deadline={detail.deadline} /></div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PriorityBadge priority={detail.priority} />
                  <StatusBadge status={detail.status} />
                  {isOwner && (
                    <button onClick={openEdit} className="p-1.5 rounded-lg transition-all cursor-pointer" style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      title="Өзгөртүү"
                    ><Pencil size={12} /></button>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            {!editing && <div className="space-y-2">
              {detail.description && (
                <p className="text-[13px] text-slate-500 leading-relaxed">{detail.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-[12px] text-slate-400">
                {detail.address && <span>📍 {detail.address}</span>}
                {detail.region && <span>🗺 {detail.region}{detail.district ? `, ${detail.district}` : ''}</span>}
                {detail.phone && (
                  <a href={`tel:${detail.phone}`} className="font-medium" style={{ color: '#10b981' }} onClick={e => e.stopPropagation()}>
                    📞 {detail.phone}
                  </a>
                )}
              </div>
              {detail.beneficiary && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                  onClick={() => { setDetail(null); navigate(`/beneficiaries/${detail.beneficiary._id}`); }}
                >
                  <span className="text-[12px] font-medium" style={{ color: '#3b82f6' }}>
                    👤 {detail.beneficiary.fullName}
                  </span>
                  {detail.beneficiary.inn && (
                    <span className="text-[11px] text-blue-300">· {detail.beneficiary.inn}</span>
                  )}
                  <ChevronRight size={12} style={{ color: '#3b82f6', marginLeft: 'auto' }} />
                </div>
              )}
              <p className="text-[11px] text-slate-300">
                Жазган: {detail.createdByFoundation?.name || '—'} · {new Date(detail.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>}

            {/* Change status */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="text-[12px] font-semibold text-slate-600">Статусту өзгөртүү</p>
              <div className="flex gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewStatus(key)}
                    className="flex-1 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
                    style={newStatus === key
                      ? { background: cfg.color, color: '#fff' }
                      : { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }
                    }
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Изох (милдеттүү эмес)..."
                  className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                  style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <Button onClick={handleStatusChange} loading={changingStatus} disabled={!newStatus}>
                  <Send size={13} />
                </Button>
              </div>
            </div>

            {/* Add comment (without status change) */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-slate-600 flex items-center gap-1.5">
                <MessageSquare size={13} style={{ color: '#94a3b8' }} /> Комментарий кошуу
              </p>
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  placeholder="Маалымат же суроо жазыңыз..."
                  className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                  style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addingComment}
                  className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer disabled:opacity-40"
                  style={{ background: '#eff6ff', color: '#6366f1', border: '1px solid #c7d2fe' }}
                >
                  {addingComment ? '...' : <Send size={13} />}
                </button>
              </div>
            </div>

            {/* History */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-slate-600">Тарых</p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {[...detail.history].reverse().map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.open;
                  const isComment = i > 0 && detail.history[detail.history.length - 1 - i]?.status === detail.history[detail.history.length - i]?.status;
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: isComment ? '#6366f1' : cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium" style={{ color: isComment ? '#6366f1' : cfg.color }}>
                            {isComment ? 'Комментарий' : cfg.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            · {h.changedByFoundation?.name || h.changedBy?.name || 'Белгисиз'}
                          </span>
                        </div>
                        {h.comment && <p className="text-[12px] text-slate-500 mt-0.5">{h.comment}</p>}
                        <p className="text-[10px] text-slate-300 mt-0.5">{new Date(h.changedAt).toLocaleString('ru-RU')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete */}
            {isOwner && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleDelete(detail._id)}
                  className="text-[12px] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{ color: '#dc2626', border: '1px solid #fecaca' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Маалыматты өчүрүү
                </button>
              </div>
            )}
          </div>
        )})() : null}
      </Modal>
    </div>
  );
}
