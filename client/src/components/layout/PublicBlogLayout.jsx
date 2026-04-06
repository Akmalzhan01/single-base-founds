import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, LayoutDashboard } from 'lucide-react';

export default function PublicBlogLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Minimal header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(user ? '/' : '/blog')}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            FD
          </div>
          <span className="text-[14px] font-semibold text-slate-700">FundsDB <span className="text-slate-400 font-normal">/ Блог</span></span>
        </div>

        {/* Action */}
        {user ? (
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            style={{ color: '#475569', background: '#f1f5f9' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <LayoutDashboard size={14} strokeWidth={1.8} />
            Башкы бет
          </button>
        ) : (
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
        )}
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
