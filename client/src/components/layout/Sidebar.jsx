import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Building2, LogOut, Search, ChevronRight, Map, Bell, UserCircle, Shield, Settings, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Башкы бет' },
  { to: '/lists', icon: Users, label: 'Муктаждар' },
  { to: '/create', icon: UserPlus, label: 'Жаңы муктаж' },
  { to: '/check', icon: Search, label: 'Текшерүү' },
  { to: '/map', icon: Map, label: 'Карта' },
  { to: '/notices', icon: Bell, label: 'Маалымат тактасы' },
  { to: '/blog', icon: BookOpen, label: 'Блог' },
];

const adminItems = [
  { to: '/foundations', icon: Building2, label: 'Фонддор' },
  { to: '/audit', icon: Shield, label: 'Аудит лог' },
];

const fondAdminItems = [
  { to: '/staff', icon: Users, label: 'Кызматкерлер' },
  { to: '/settings', icon: Settings, label: 'Фонд жөндөөлөрү' },
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const w = collapsed ? 64 : 220;

  return (
    <aside
      className="h-screen flex flex-col shrink-0 transition-all duration-200 overflow-y-auto"
      style={{ width: w, background: '#0d0d18', overflow: 'hidden' }}
    >
      {/* Logo */}
      <div className="px-3 py-6 flex items-center gap-3" style={{ minHeight: 56 }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}
        >
          <span className="text-white text-xs font-bold tracking-tight">FD</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none">FundsDB</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: '#4b5563' }}>
              {user?.foundation?.name || 'Платформа'}
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive ? 'text-white' : 'text-[#6b7280] hover:text-[#d1d5db]'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} style={{ color: isActive ? '#34d399' : 'inherit', shrink: 0 }} />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!collapsed && isActive && <ChevronRight size={12} style={{ color: '#34d399', opacity: 0.6 }} />}
              </>
            )}
          </NavLink>
        ))}

        {!user?.isSuperadmin && user?.role === 'fond_admin' && (
          <>
            {!collapsed && (
              <div className="pt-5 pb-2 px-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#374151' }}>
                  Башкаруу
                </span>
              </div>
            )}
            {collapsed && <div className="pt-4 pb-1 mx-2.5 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
            {fondAdminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive ? '' : 'text-[#6b7280] hover:text-[#d1d5db]'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' } : {}}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} style={{ color: isActive ? '#34d399' : 'inherit' }} />
                    {!collapsed && <span>{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}

        {user?.isSuperadmin && (
          <>
            {!collapsed && (
              <div className="pt-5 pb-2 px-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#374151' }}>
                  Суперадмин
                </span>
              </div>
            )}
            {collapsed && <div className="pt-4 pb-1 mx-2.5 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive ? '' : 'text-[#6b7280] hover:text-[#d1d5db]'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' } : {}}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} style={{ color: isActive ? '#34d399' : 'inherit' }} />
                    {!collapsed && <span>{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-2 pb-5">
        <div className="h-px mx-1 mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              {getInitials(user?.name || '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium truncate" style={{ color: '#e5e7eb' }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: '#4b5563' }}>
                {user?.isSuperadmin ? 'Суперадмин' : user?.role === 'fond_admin' ? 'Администратор' : 'Кызматкер'}
              </p>
            </div>
          </div>
        )}

        <NavLink
          to="/profile"
          title={collapsed ? 'Профиль' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 cursor-pointer ${
              isActive ? '' : ''
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? '#34d399' : '#6b7280',
            background: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
          })}
          onMouseEnter={e => { if (!e.currentTarget.style.background.includes('rgba(16,185,129')) e.currentTarget.style.color = '#d1d5db'; }}
          onMouseLeave={e => { if (!e.currentTarget.style.background.includes('rgba(16,185,129')) e.currentTarget.style.color = '#6b7280'; }}
        >
          {() => (
            <>
              <UserCircle size={14} strokeWidth={1.8} />
              {!collapsed && <span>Профиль</span>}
            </>
          )}
        </NavLink>

        <button
          onClick={logout}
          title={collapsed ? 'Чыгуу' : undefined}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 cursor-pointer"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <LogOut size={14} strokeWidth={1.8} />
          {!collapsed && <span>Чыгуу</span>}
        </button>
      </div>
    </aside>
  );
}
