import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Eye, Send, Trash, Megaphone, Newspaper, Trophy, Pencil, Trash2, Share2 } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { renderMarkdown } from '../utils/markdown';

const TYPE_CONFIG = {
  elon:      { label: 'Жарыя',    color: '#3b82f6', bg: '#eff6ff',  icon: Megaphone },
  yangilik:  { label: 'Жаңылык',  color: '#10b981', bg: '#f0fdf4',  icon: Newspaper },
  musobaqa:  { label: 'Конкурс',  color: '#f59e0b', bg: '#fffbeb',  icon: Trophy    },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.elon;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} strokeWidth={2.5} />
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
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`)
      .then(r => setPost(r.data.data))
      .catch(() => toast.error('Жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${id}/like`);
      setPost(p => {
        const uid = String(user?._id);
        const likes = res.data.liked
          ? [...(p.likes || []), uid]
          : (p.likes || []).filter(x => String(x) !== uid);
        return { ...p, likes };
      });
    } catch {
      toast.error('Ката кетти');
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { text: commentText });
      setPost(p => ({ ...p, comments: [...(p.comments || []), res.data.data] }));
      setCommentText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      setPost(p => ({ ...p, comments: p.comments.filter(c => c._id !== commentId) }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.body?.slice(0, 100), url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Шилтеме көчүрүлдү');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Постту өчүрөсүзбү?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Өчүрүлдү');
      navigate('/blog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!post) return (
    <div className="text-center py-20 text-slate-400">
      <p>Пост табылган жок</p>
      <button onClick={() => navigate('/blog')} className="mt-3 text-[13px] text-emerald-500 cursor-pointer">← Блогго кайтуу</button>
    </div>
  );

  const liked = (post.likes || []).some(x => String(x) === String(user?._id));
  const likeCount = (post.likes || []).length;
  const isOwner = user?.isSuperadmin || String(post.foundation?._id) === String(user?.foundation?._id);

  const canDeleteComment = (c) =>
    user?.isSuperadmin ||
    String(c.user?._id || c.user) === String(user?._id) ||
    String(c.foundation?._id || c.foundation) === String(user?.foundation?._id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/blog')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-all"
        style={{ color: '#64748b' }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Блогго кайтуу
      </button>

      {/* Card */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        {/* Image */}
        {post.image && (
          <img src={post.image} alt="" className="w-full object-cover" style={{ maxHeight: 360 }} />
        )}

        <div className="p-6">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={post.type} />
              <span className="text-[13px] font-semibold text-slate-700">{post.foundation?.name}</span>
              <span className="text-slate-200">·</span>
              <span className="text-[12px] text-slate-400">{timeAgo(post.createdAt)}</span>
            </div>

            {isOwner && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => navigate(`/blog/${id}/edit`)}
                  className="p-1.5 rounded-lg cursor-pointer transition-all"
                  style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  title="Өзгөртүү"
                ><Pencil size={13} /></button>
                <button
                  onClick={handleDeletePost}
                  className="p-1.5 rounded-lg cursor-pointer transition-all"
                  style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  title="Өчүрүү"
                ><Trash2 size={13} /></button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-slate-800 leading-snug mb-4">{post.title}</h1>

          {/* Body */}
          <div
            className="text-[14px] text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />

          {/* Author */}
          {post.author?.name && (
            <p className="text-[12px] text-slate-300 mt-4">Автор: {post.author.name}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
            {/* Like */}
            {user ? (
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-all rounded-xl px-3 py-1.5"
                style={{ color: liked ? '#ef4444' : '#94a3b8', background: liked ? '#fef2f2' : '#f8fafc' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = liked ? '#fef2f2' : '#f8fafc'; e.currentTarget.style.color = liked ? '#ef4444' : '#94a3b8'; }}
              >
                <Heart size={15} fill={liked ? '#ef4444' : 'none'} strokeWidth={liked ? 0 : 1.8} />
                <span>{likeCount > 0 ? likeCount : ''} Лайк</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#94a3b8' }}>
                <Heart size={15} strokeWidth={1.8} />
                <span>{likeCount > 0 ? likeCount : ''} Лайк</span>
              </span>
            )}

            {/* Comments count */}
            <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
              <MessageCircle size={15} strokeWidth={1.8} />
              <span>{(post.comments || []).length} комментарий</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
              <Eye size={14} strokeWidth={1.8} />
              <span>{post.views || 0} көрүү</span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-all rounded-xl px-3 py-1.5 ml-auto"
              style={{ color: '#94a3b8', background: '#f8fafc' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Share2 size={14} strokeWidth={1.8} />
              <span>Бөлүшүү</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-2xl p-5 space-y-4" style={{
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <h3 className="text-[15px] font-bold text-slate-800">
          Комментарийлер
          {(post.comments || []).length > 0 && (
            <span className="ml-2 text-[13px] font-normal text-slate-400">{post.comments.length}</span>
          )}
        </h3>

        {/* Comment list */}
        {(post.comments || []).length === 0 ? (
          <p className="text-[13px] text-slate-300 py-4 text-center">Азырынча комментарий жок</p>
        ) : (
          <div className="space-y-4">
            {post.comments.map(c => (
              <div key={c._id} className="flex items-start gap-3 group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[11px] font-semibold mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                >
                  {(c.user?.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-semibold text-slate-700">{c.user?.name || '—'}</span>
                    {c.foundation?.name && (
                      <span className="text-[11px] text-slate-400">{c.foundation.name}</span>
                    )}
                    <span className="text-[11px] text-slate-300">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{c.text}</p>
                </div>
                {canDeleteComment(c) && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg cursor-pointer transition-all shrink-0"
                    style={{ color: '#cbd5e1' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}
                    title="Өчүрүү"
                  >
                    <Trash size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add comment input — only for logged in users */}
        {!user && (
          <div className="text-center py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] font-medium cursor-pointer transition-all"
              style={{ color: '#10b981' }}
            >
              Комментарий жазуу үчүн кириңиз →
            </button>
          </div>
        )}
        {user && <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
            placeholder="Комментарий жазыңыз..."
            className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300 transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            onClick={handleSendComment}
            disabled={sending || !commentText.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all shrink-0 text-white"
            style={{ background: commentText.trim() ? '#10b981' : '#e2e8f0', color: commentText.trim() ? '#fff' : '#94a3b8' }}
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>}
      </div>
    </div>
  );
}
