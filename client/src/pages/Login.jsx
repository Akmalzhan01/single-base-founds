import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Heart } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate(state?.from || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0d0d18' }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-105 shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #0d0d18 0%, #0a1a12 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}
          >
            <span className="text-white font-bold text-sm">FD</span>
          </div>
          <span className="text-white font-semibold text-[15px]">FundsDB</span>
        </div>

        <div className="space-y-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <Heart size={24} style={{ color: '#10b981' }} />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Муктаждарга<br />
            <span style={{ color: '#10b981' }}>жардам</span> берүү<br />
            системасы
          </h1>
          <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
            Фонддордун жардам иш-аракеттерин эффективдүү башкарыңыз жана муктаждарды тез табыңыз.
          </p>
        </div>

        <div style={{ color: '#374151', fontSize: '12px' }}>
          © 2025 FundsDB
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-90">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}
            >
              <span className="text-white font-bold">FD</span>
            </div>
            <span className="text-white font-semibold text-lg">FundsDB</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Кош келдиңиз</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Системага кирүү үчүн маалыматтарды толтуруңуз
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                Телефон номери
              </label>
              <input
                type="tel"
                placeholder="+996 555 123 456"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder:text-[#374151] outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
                Сырсөз
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-[14px] text-white placeholder:text-[#374151] outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
              style={{ background: loading ? '#059669' : '#10b981', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = '#059669')}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = '#10b981')}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Кирилүүдө...' : 'Кирүү'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
