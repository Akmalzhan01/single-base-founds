import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, ShieldCheck, ShieldOff, KeyRound, X, Eye, EyeOff } from 'lucide-react';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const EMPTY = { name: '', phone: '', password: '', role: 'fond_staff' };

function RoleBadge({ role }) {
  const cfg = role === 'fond_admin'
    ? { label: 'Администратор', bg: '#eff6ff', color: '#3b82f6' }
    : { label: 'Кызматкер', bg: '#f0fdf4', color: '#16a34a' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: isActive ? '#f0fdf4' : '#fef2f2', color: isActive ? '#16a34a' : '#dc2626' }}>
      {isActive ? 'Активдүү' : 'Блокталган'}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'password'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then(r => setStaff(r.data.data))
      .catch(() => toast.error('Маалымат жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(EMPTY);
    setShowPw(false);
    setModal('add');
  }

  function openEdit(user) {
    setSelected(user);
    setForm({ name: user.name, phone: user.phone, role: user.role, password: '' });
    setShowPw(false);
    setModal('edit');
  }

  function openPassword(user) {
    setSelected(user);
    setForm({ password: '' });
    setShowPw(false);
    setModal('password');
  }

  function closeModal() { setModal(null); setSelected(null); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) return toast.error('Бардык талааларды толтуруңуз');
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('Кызматкер кошулду');
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally { setSaving(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${selected._id}`, { name: form.name, phone: form.phone, role: form.role });
      toast.success('Өзгөртүүлөр сакталды');
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally { setSaving(false); }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (!form.password || form.password.length < 6) return toast.error('Кеминде 6 белги болушу керек');
    setSaving(true);
    try {
      await api.put(`/users/${selected._id}`, { password: form.password });
      toast.success('Сырсөз жаңыланды');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally { setSaving(false); }
  }

  async function toggleActive(user) {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'Кызматкер блокталды' : 'Кызматкер активдештирилди');
      load();
    } catch {
      toast.error('Ката кетти');
    }
  }

  async function handleDelete(user) {
    if (!confirm(`"${user.name}" кызматкерин өчүрөсүзбү?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      toast.success('Кызматкер өчүрүлдү');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    }
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-[13px] outline-none transition-all';
  const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={20} style={{ color: '#3b82f6' }} /> Кызматкерлер
          </h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Фонддун кызматкерлерин башкаруу · жалпы {staff.length}</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
          style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
        >
          <Plus size={14} strokeWidth={2.5} /> Кызматкер кошуу
        </button>
      </div>

      {loading ? <Spinner /> : staff.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Кызматкерлер жок</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Аты-жөнү', 'Телефон', 'Роль', 'Абалы', 'Катталган', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                        {u.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{u.phone}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} title="Өзгөртүү"
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all text-slate-400 hover:text-blue-600"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      ><Pencil size={13} /></button>

                      <button onClick={() => openPassword(u)} title="Сырсөз алмаштыруу"
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all text-slate-400 hover:text-violet-600"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      ><KeyRound size={13} /></button>

                      <button onClick={() => toggleActive(u)} title={u.isActive ? 'Блоктоо' : 'Активдештируу'}
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all"
                        style={{ background: 'transparent', color: u.isActive ? '#f59e0b' : '#16a34a' }}
                        onMouseEnter={e => e.currentTarget.style.background = u.isActive ? '#fffbeb' : '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >{u.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}</button>

                      <button onClick={() => handleDelete(u)} title="Өчүрүү"
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all text-slate-400 hover:text-red-500"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                      ><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {modal === 'add' && (
        <Modal title="Жаңы кызматкер кошуу" onClose={closeModal}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Аты-жөнү</label>
              <input className={inputCls} style={inputStyle} placeholder="Иванов Иван Иванович"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Телефон</label>
              <input className={inputCls} style={inputStyle} placeholder="+996 555 000 000"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Сырсөз</label>
              <div className="relative">
                <input className={inputCls} style={{ ...inputStyle, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'} placeholder="Кеминде 6 белги"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Роль</label>
              <select className={inputCls} style={inputStyle}
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="fond_staff">Кызматкер</option>
                <option value="fond_admin">Администратор</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-slate-600"
                style={{ background: '#f1f5f9' }}>Жокко чыгаруу</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-white"
                style={{ background: '#3b82f6', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сакталууда...' : 'Кошуу'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <Modal title="Кызматкерди өзгөртүү" onClose={closeModal}>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Аты-жөнү</label>
              <input className={inputCls} style={inputStyle}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Телефон</label>
              <input className={inputCls} style={inputStyle}
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Роль</label>
              <select className={inputCls} style={inputStyle}
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="fond_staff">Кызматкер</option>
                <option value="fond_admin">Администратор</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-slate-600"
                style={{ background: '#f1f5f9' }}>Жокко чыгаруу</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-white"
                style={{ background: '#3b82f6', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сакталууда...' : 'Сактоо'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Password modal */}
      {modal === 'password' && selected && (
        <Modal title={`Сырсөз алмаштыруу — ${selected.name}`} onClose={closeModal}>
          <form onSubmit={handlePassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Жаңы сырсөз</label>
              <div className="relative">
                <input className={inputCls} style={{ ...inputStyle, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'} placeholder="Кеминде 6 белги"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-slate-600"
                style={{ background: '#f1f5f9' }}>Жокко чыгаруу</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-white"
                style={{ background: '#6366f1', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сакталууда...' : 'Алмаштыруу'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
