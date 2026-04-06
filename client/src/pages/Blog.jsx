import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Newspaper, Trophy, Pencil, Trash2, X, Image, Heart, MessageCircle, Send, Trash, Eye, Share2 } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { renderMarkdown } from '../utils/markdown';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const TYPE_CONFIG = {
  elon:      { label: 'Жарыя',    color: '#3b82f6', bg: '#eff6ff',  icon: Megaphone },
  yangilik:  { label: 'Жаңылык',  color: '#10b981', bg: '#f0fdf4',  icon: Newspaper },
  musobaqa:  { label: 'Конкурс',  color: '#f59e0b', bg: '#fffbeb',  icon: Trophy    },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.elon;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} strokeWidth={2.5} />
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
  if (d < 30) return `${d} күн мурун`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300 transition-all';
const inputStyle = { background: '#fff', border: '1px solid #e2e8f0' };
const focusStyle = { borderColor: '#10b981' };
const blurStyle = { borderColor: '#e2e8f0' };

const EMPTY_FORM = { title: '', body: '', type: 'elon' };

const TOOLBAR = [
  { label: 'B',   title: 'Жирный (**)',    style: { fontWeight: 800 },              wrap: ['**', '**'] },
  { label: 'I',   title: 'Курсив (*)',      style: { fontStyle: 'italic' },          wrap: ['*', '*']   },
  { label: 'S',   title: 'Зызыктуу (~~)',   style: { textDecoration: 'line-through'},wrap: ['~~', '~~'] },
  null,
  { label: 'H1',  title: 'Heading 1 (# )',  line: '# '  },
  { label: 'H2',  title: 'Heading 2 (## )', line: '## ' },
  { label: 'H3',  title: 'Heading 3 (### )',line: '### '},
  null,
  { label: '• Тизме', title: 'Тизме (- )',  line: '- '  },
];

function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  const applyWrap = (before, after) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.substring(s, e);
    const next = value.substring(0, s) + before + sel + after + value.substring(e);
    onChange(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); }, 0);
  };

  const applyLine = (prefix) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const next = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length); }, 0);
  };

  return (
    <div style={{ border: `1px solid ${focused ? '#10b981' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        {TOOLBAR.map((t, i) =>
          t === null ? (
            <div key={i} style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 3px' }} />
          ) : (
            <button
              key={t.label} type="button" title={t.title}
              onMouseDown={e => { e.preventDefault(); t.wrap ? applyWrap(t.wrap[0], t.wrap[1]) : applyLine(t.line); }}
              className="px-2 py-1 rounded-lg text-[11px] cursor-pointer transition-all"
              style={{ color: '#475569', minWidth: 26, ...t.style }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{t.label}</button>
          )
        )}
      </div>
      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-3.5 py-2.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
        style={{ resize: 'vertical', background: '#fff', display: 'block', fontFamily: 'ui-monospace, monospace', lineHeight: 1.6 }}
      />
    </div>
  );
}

function PostModal({ open, onClose, onSaved, initial }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [foundations, setFoundations] = useState([]);
  const [foundationId, setFoundationId] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? { title: initial.title, body: initial.body, type: initial.type } : EMPTY_FORM);
      setImageFile(null);
      if (user?.isSuperadmin && !initial) {
        api.get('/foundations').then(r => {
          const list = r.data.data || r.data;
          setFoundations(list);
          if (list.length) setFoundationId(list[0]._id);
        }).catch(() => {});
      }
    }
  }, [open, initial, user]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Аталыш жазыңыз');
    if (!form.body.trim()) return toast.error('Мазмун жазыңыз');
    if (user?.isSuperadmin && !initial && !foundationId) return toast.error('Фонд тандаңыз');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('body', form.body);
      fd.append('type', form.type);
      if (imageFile) fd.append('image', imageFile);
      if (user?.isSuperadmin && !initial) fd.append('foundationId', foundationId);

      let res;
      if (initial) {
        res = await api.put(`/posts/${initial._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(initial ? 'Өзгөртүлдү' : 'Жарыяланды');
      onSaved(res.data.data, !!initial);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl w-full max-w-lg space-y-4 p-6" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-bold text-slate-800">{initial ? 'Постту өзгөртүү' : 'Жаңы пост'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer" style={{ color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <X size={16} />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} type="button" onClick={() => setForm(p => ({ ...p, type: key }))}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={form.type === key
                  ? { background: cfg.color, color: '#fff' }
                  : { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }
                }
              >
                <Icon size={12} /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Foundation selector — superadmin only */}
        {user?.isSuperadmin && !initial && foundations.length > 0 && (
          <select
            value={foundationId}
            onChange={e => setFoundationId(e.target.value)}
            className={inputCls}
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => Object.assign(e.target.style, blurStyle)}
          >
            {foundations.map(f => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        )}

        <input className={inputCls} style={inputStyle} placeholder="Аталыш *"
          value={form.title} onChange={set('title')}
          onFocus={e => Object.assign(e.target.style, focusStyle)}
          onBlur={e => Object.assign(e.target.style, blurStyle)}
        />

        <RichTextEditor
          value={form.body}
          onChange={v => setForm(p => ({ ...p, body: v }))}
          placeholder="Мазмун *"
        />

        {/* Image upload */}
        <div>
          <label className="flex items-center gap-2 text-[12px] font-medium text-slate-400 cursor-pointer w-fit">
            <Image size={13} />
            {imageFile ? imageFile.name : 'Сүрөт кошуу (милдеттүү эмес)'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0] || null)} />
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
            style={{ background: '#f1f5f9', color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >Жокко чыгаруу</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all text-white"
            style={{ background: saving ? '#6ee7b7' : '#10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = saving ? '#6ee7b7' : '#10b981'; }}
          >{saving ? 'Сакталууда...' : initial ? 'Сактоо' : 'Жарыялоо'}</button>
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ post, user, onPostUpdate }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const comments = post.comments || [];

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text });
      onPostUpdate(post._id, p => ({ ...p, comments: [...(p.comments || []), res.data.data] }));
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      onPostUpdate(post._id, p => ({ ...p, comments: p.comments.filter(c => c._id !== commentId) }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  const canDeleteComment = (comment) =>
    user?.isSuperadmin ||
    String(comment.user?._id || comment.user) === String(user?._id) ||
    String(comment.foundation?._id || comment.foundation) === String(user?.foundation?._id);

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
      {comments.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {comments.map(c => (
            <div key={c._id} className="flex items-start gap-2 group">
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-semibold mt-0.5"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {(c.user?.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[12px] font-semibold text-slate-700">{c.user?.name || '—'}</span>
                  {c.foundation?.name && (
                    <span className="text-[10px] text-slate-400">{c.foundation.name}</span>
                  )}
                  <span className="text-[10px] text-slate-300">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">{c.text}</p>
              </div>
              {canDeleteComment(c) && (
                <button onClick={() => handleDelete(c._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded cursor-pointer transition-all shrink-0"
                  style={{ color: '#cbd5e1' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; }}
                  title="Өчүрүү">
                  <Trash size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Комментарий жазыңыз..."
          className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none text-slate-700 placeholder:text-slate-300 transition-all"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button onClick={handleSend} disabled={sending || !text.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all shrink-0 text-white"
          style={{ background: text.trim() ? '#10b981' : '#e2e8f0', color: text.trim() ? '#fff' : '#94a3b8' }}>
          <Send size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function Blog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [openComments, setOpenComments] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    api.get(`/posts?${params}`)
      .then(r => { setPosts(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (post, isEdit) => {
    if (isEdit) {
      setPosts(p => p.map(x => x._id === post._id ? post : x));
    } else {
      setPosts(p => [post, ...p]);
      setTotal(t => t + 1);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Постту өчүрөсүзбү?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(p => p.filter(x => x._id !== id));
      setTotal(t => t - 1);
      toast.success('Өчүрүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(p => p.map(x => {
        if (x._id !== postId) return x;
        const uid = String(user?._id);
        const liked = res.data.liked;
        const likes = liked
          ? [...(x.likes || []), uid]
          : (x.likes || []).filter(id => String(id) !== uid);
        return { ...x, likes };
      }));
    } catch (err) {
      toast.error('Ката кетти');
    }
  };

  const updatePost = (postId, updater) => {
    setPosts(p => p.map(x => x._id === postId ? updater(x) : x));
  };

  const openEdit = (post) => { setEditPost(post); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditPost(null); };

  const isOwner = (post) => user?.isSuperadmin || String(post.foundation?._id) === String(user?.foundation?._id);
  const isLiked = (post) => (post.likes || []).some(id => String(id) === String(user?._id));

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #0a2a1c 50%, #0d1117 100%)',
          minHeight: 180,
        }}
      >
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: 60,
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }} />

        <div className="relative p-7">
          {/* top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>FD</div>
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#10b981' }}>FundsDB Блог</span>
              </div>
              <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight">
                Жарыялар, жаңылыктар<br />
                <span style={{ color: '#10b981' }}>жана конкурстар</span>
              </h1>
              <p className="text-[13px] mt-1.5" style={{ color: '#4b5563' }}>
                Фонддордун бардык маалыматтары бир жерде
              </p>
            </div>

            {user && (
              <button
                onClick={() => { setEditPost(null); setModalOpen(true); }}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all text-white shrink-0"
                style={{ background: '#10b981', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
              >
                <Plus size={14} strokeWidth={2.5} /> Жарыялоо
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-5 flex-wrap">
            {[
              { label: 'Жалпы пост', value: total },
              { label: 'Лайк', value: totalLikes },
              { label: 'Көрүү', value: totalViews },
              ...Object.entries(TYPE_CONFIG).map(([key, v]) => ({
                label: v.label, value: posts.filter(p => p.type === key).length, color: v.color,
              })),
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[20px] font-bold" style={{ color: s.color || '#fff', lineHeight: 1 }}>{s.value}</span>
                <span className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[['', 'Баары'], ...Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilterType(key)}
            className="px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
            style={filterType === key
              ? { background: '#0d0d18', color: '#fff' }
              : { background: '#f1f5f9', color: '#64748b' }
            }
          >{label}</button>
        ))}
      </div>

      {/* Posts */}
      {loading ? <Spinner /> : posts.length === 0 ? (
        <div className="text-center py-20 text-slate-300">
          <Newspaper size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-[13px]">Азырынча пост жок</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const isOpen = expanded === post._id;
            const showComments = openComments === post._id;
            const liked = isLiked(post);
            const likeCount = (post.likes || []).length;
            const commentCount = (post.comments || []).length;
            return (
              <div key={post._id} className="rounded-2xl overflow-hidden cursor-pointer" style={cardStyle} onClick={() => navigate(`/blog/${post._id}`)}>
                {/* Image */}
                {post.image && (
                  <img src={post.image} alt="" className="w-full object-cover" style={{ maxHeight: 220 }} />
                )}

                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={post.type} />
                      <span className="text-[12px] font-semibold text-slate-700">{post.foundation?.name}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[12px] text-slate-400">{timeAgo(post.createdAt)}</span>
                    </div>
                    {isOwner(post) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                          className="p-1.5 rounded-lg cursor-pointer transition-all"
                          style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          title="Өзгөртүү"
                        ><Pencil size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(post._id); }}
                          className="p-1.5 rounded-lg cursor-pointer transition-all"
                          style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          title="Өчүрүү"
                        ><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-[16px] font-bold text-slate-800 leading-snug mb-2">{post.title}</h2>

                  {/* Body */}
                  <div className="relative">
                    <div
                      className="text-[13px] text-slate-500 leading-relaxed"
                      style={!isOpen ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
                    />
                    {post.body.length > 280 && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : post._id)}
                        className="text-[12px] font-medium mt-1 cursor-pointer transition-all"
                        style={{ color: '#10b981' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#059669'}
                        onMouseLeave={e => e.currentTarget.style.color = '#10b981'}
                      >
                        {isOpen ? 'Жабуу ▲' : 'Толугу менен окуу ▼'}
                      </button>
                    )}
                  </div>

                  {/* Author */}
                  {post.author?.name && (
                    <p className="text-[11px] text-slate-300 mt-3">
                      Автор: {post.author.name}
                    </p>
                  )}

                  {/* Like & Comment actions */}
                  <div className="flex items-center gap-4 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid #f1f5f9' }}>
                    {user ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}
                        className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer transition-all rounded-lg px-2 py-1"
                        style={{ color: liked ? '#ef4444' : '#94a3b8', background: liked ? '#fef2f2' : 'transparent' }}
                        onMouseEnter={e => { if (!liked) e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = liked ? '#fef2f2' : 'transparent'; e.currentTarget.style.color = liked ? '#ef4444' : '#94a3b8'; }}
                      >
                        <Heart size={14} fill={liked ? '#ef4444' : 'none'} strokeWidth={liked ? 0 : 1.8} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                      </button>
                    ) : (
                      likeCount > 0 && (
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: '#94a3b8' }}>
                          <Heart size={14} strokeWidth={1.8} /> {likeCount}
                        </span>
                      )
                    )}

                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#94a3b8' }}>
                      <MessageCircle size={14} strokeWidth={1.8} />
                      {commentCount > 0 && <span>{commentCount}</span>}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="flex items-center gap-1 text-[12px]" style={{ color: '#94a3b8' }}>
                        <Eye size={13} strokeWidth={1.8} />
                        {post.views > 0 && <span>{post.views}</span>}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/blog/${post._id}`;
                          if (navigator.share) {
                            try { await navigator.share({ title: post.title, url }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(url);
                            toast.success('Шилтеме көчүрүлдү');
                          }
                        }}
                        className="flex items-center gap-1 text-[12px] font-medium cursor-pointer transition-all rounded-lg px-2 py-1"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        <Share2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  {/* Comments section */}
                  {showComments && (
                    <CommentsSection
                      post={post}
                      user={user}
                      onPostUpdate={updatePost}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PostModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        initial={editPost}
      />
    </div>
  );
}
