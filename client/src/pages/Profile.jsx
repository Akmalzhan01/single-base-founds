import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Check } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Profile() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      return toast.error('Жаңы сырсөздөр дал келбейт');
    }
    if (newPassword && newPassword.length < 6) {
      return toast.error('Сырсөз кеминде 6 символ болсун');
    }

    setSaving(true);
    try {
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await api.put('/auth/profile', payload);
      if (setUser) setUser(prev => ({ ...prev, name: res.data.data.name }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Сакталды');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSaving(false);
    }
  };

  const colors = [['#3b82f6', '#6366f1'], ['#10b981', '#059669'], ['#f59e0b', '#f97316'], ['#a855f7', '#7c3aed']];
  const [from, to] = colors[(user?.name?.charCodeAt(0) || 0) % colors.length];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Avatar card */}
      <div className="rounded-2xl p-6 flex items-center gap-5" style={cardStyle}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-[22px] font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 6px 20px ${from}50` }}
        >
          {getInitials(user?.name || '')}
        </div>
        <div>
          <p className="text-[17px] font-bold text-slate-800">{user?.name || '—'}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">{user?.phone || '—'}</p>
          <div className="flex items-center gap-2 mt-2">
            {user?.isSuperadmin ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fef3c7', color: '#d97706' }}>Суперадмин</span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                {user?.role === 'fond_admin' ? 'Фонд админи' : 'Кызматкер'}
              </span>
            )}
            {user?.foundation?.name && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                {user.foundation.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
        {/* Name */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} style={{ color: '#10b981' }} />
            <p className="text-[13px] font-semibold text-slate-700">Жалпы маалымат</p>
          </div>
          <Input
            label="Аты-жөнү"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Толук аты-жөнүңүз"
          />
        </div>

        <div className="border-t border-slate-100" />

        {/* Password */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} style={{ color: '#6366f1' }} />
            <p className="text-[13px] font-semibold text-slate-700">Сырсөздү өзгөртүү</p>
            <span className="text-[11px] text-slate-400">(милдеттүү эмес)</span>
          </div>

          <div className="relative">
            <Input
              label="Азыркы сырсөз"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Жаңы сырсөз"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Кеминде 6 символ"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <Input
            label="Жаңы сырсөздү тастыктоо"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Кайталаңыз"
          />

          {newPassword && confirmPassword && (
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: newPassword === confirmPassword ? '#10b981' : '#ef4444' }}>
              <Check size={12} />
              {newPassword === confirmPassword ? 'Дал келет' : 'Дал келбейт'}
            </div>
          )}
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          Сактоо
        </Button>
      </div>
    </div>
  );
}
