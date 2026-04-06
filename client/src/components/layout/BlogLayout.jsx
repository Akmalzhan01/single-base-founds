import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu, LogIn } from 'lucide-react';

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function BlogLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isBlogDetail = location.pathname.match(/^\/blog\/[^/]+$/);
  const title = isBlogDetail ? 'Пост' : 'Блог';

  // ── Logged in: full layout with sidebar ──
  if (user) {
    return (
      <div className="flex min-h-screen" style={{ background: '#f0f4f8' }}>
        <Sidebar collapsed={collapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10"
            style={{ background: 'rgba(240,244,248,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCollapsed(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer"
                style={{ color: '#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                <Menu size={16} strokeWidth={2} />
              </button>
              <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              title={user?.name}
            >
              {getInitials(user?.name || '')}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Not logged in: minimal public layout ──
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/blog')}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            FD
          </div>
          <span className="text-[14px] font-semibold text-slate-700">
            FundsDB <span className="text-slate-400 font-normal">/ Блог</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all text-white"
          style={{ background: '#10b981' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
        >
          <LogIn size={14} strokeWidth={2} />
          Кирүү
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
