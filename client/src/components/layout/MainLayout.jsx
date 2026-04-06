import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { Menu, Plus } from 'lucide-react';

const pageTitles = {
  '/': 'Башкы бет',
  '/lists': 'Муктаждар',
  '/create': 'Жаңы муктаж кошуу',
  '/check': 'Тездик текшерүү',
  '/foundations': 'Фонддор',
  '/map': 'Картада муктаждар',
  '/notices': 'Маалымат тактасы',
  '/profile': 'Профиль',
  '/audit': 'Аудит лог',
  '/staff': 'Кызматкерлер',
  '/settings': 'Фонд созламалары',
  '/blog': 'Блог',
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isDetailPage = location.pathname.match(/^\/beneficiaries\/[^/]+$/);
  const isBlogDetail = location.pathname.match(/^\/blog\/[^/]+$/);
  const isEditPage = location.pathname.endsWith('/edit');
  const title = isEditPage
    ? 'Маалыматтарды өзгөртүү'
    : isDetailPage
    ? 'Муктаж профили'
    : isBlogDetail
    ? 'Пост'
    : (pageTitles[location.pathname] || 'FundsDB');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>
      <Sidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10"
          style={{ background: 'rgba(240,244,248,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            {/* Burger */}
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

          <div className="flex items-center gap-2">
            {location.pathname !== '/create' && !isDetailPage && (
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{ background: '#10b981', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
              >
                <Plus size={14} strokeWidth={2.5} />
                Кошуу
              </button>
            )}

            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold text-white cursor-default shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              title={user?.name}
            >
              {getInitials(user?.name || '')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
