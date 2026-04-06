import { useEffect, useState } from 'react';
import { Plus, Building2, Phone, MapPin, Pencil, Trash2, Users, X, Eye, EyeOff, Check } from 'lucide-react';
import api from '../../config/axios';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const EMPTY_FORM = { name: '', slug: '', phone: '', email: '', address: '' };
const EMPTY_USER = { name: '', phone: '', password: '', role: 'fond_staff' };

export default function Foundations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, obj = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Users modal
  const [usersModal, setUsersModal] = useState(null); // foundation object
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [showPass, setShowPass] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // user object being edited
  const [editUserForm, setEditUserForm] = useState({ name: '', phone: '', role: 'fond_staff', password: '' });
  const [showEditPass, setShowEditPass] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const load = () => {
    api.get('/foundations')
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Маалымат жүктөлгөн жок'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (f) => {
    setEditTarget(f);
    setForm({ name: f.name, slug: f.slug, phone: f.phone || '', email: f.email || '', address: f.address || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) return toast.error('Аты жана slug керек');
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/foundations/${editTarget._id}`, form);
        toast.success('Өзгөртүлдү');
      } else {
        await api.post('/foundations', form);
        toast.success('Фонд кошулду');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/foundations/${deleteTarget._id}`);
      toast.success('Фонд өчүрүлдү');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/foundations/${id}`, { isActive: !isActive });
      load();
    } catch {
      toast.error('Ката кетти');
    }
  };

  const openUsers = async (f) => {
    setUsersModal(f);
    setUsers([]);
    setUsersLoading(true);
    setUserForm(EMPTY_USER);
    setEditingUser(null);
    try {
      const res = await api.get(`/foundations/${f._id}/users`);
      setUsers(res.data.data);
    } catch {
      toast.error('Xodimlarni yuklashda xato');
    } finally {
      setUsersLoading(false);
    }
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({ name: u.name, phone: u.phone, role: u.role, password: '' });
    setShowEditPass(false);
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.phone) return toast.error('Аты жана телефон керек');
    setSavingUser(true);
    try {
      const body = { name: editUserForm.name, phone: editUserForm.phone, role: editUserForm.role };
      if (editUserForm.password) body.password = editUserForm.password;
      const res = await api.put(`/foundations/${usersModal._id}/users/${editingUser._id}`, body);
      setUsers(u => u.map(x => x._id === editingUser._id ? res.data.data : x));
      setEditingUser(null);
      toast.success('Өзгөртүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeletingUser(true);
    try {
      await api.delete(`/foundations/${usersModal._id}/users/${deleteUserTarget._id}`);
      setUsers(u => u.filter(x => x._id !== deleteUserTarget._id));
      setDeleteUserTarget(null);
      toast.success('Кызматкер өчүрүлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.phone || !userForm.password) return toast.error('Аты, телефон жана пароль керек');
    setAddingUser(true);
    try {
      const res = await api.post(`/foundations/${usersModal._id}/users`, userForm);
      setUsers((u) => [...u, res.data.data]);
      setUserForm(EMPTY_USER);
      toast.success('Кызматкер кошулду');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Фонддор</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Жалпы {data.length} фонд</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} strokeWidth={2.5} /> Жаңы фонд
        </Button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((f) => (
            <div key={f._id} className="rounded-2xl p-5 space-y-4 transition-all hover:-translate-y-0.5" style={cardStyle}>
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 10px rgba(16,185,129,0.25)' }}
                >
                  <Building2 size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-800 truncate">{f.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{f.slug}</p>
                </div>
                <Badge color={f.isActive ? 'green' : 'gray'}>
                  {f.isActive ? 'Активдүү' : 'Өчүрүлгөн'}
                </Badge>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                {f.phone && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    <Phone size={11} className="text-slate-300 shrink-0" />
                    {f.phone}
                  </div>
                )}
                {f.address && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-400">
                    <MapPin size={11} className="text-slate-300 shrink-0" />
                    {f.address}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => toggleActive(f._id, f.isActive)}
                  className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer font-medium"
                  style={f.isActive
                    ? { borderColor: '#fecaca', color: '#dc2626', background: 'transparent' }
                    : { borderColor: '#bbf7d0', color: '#16a34a', background: 'transparent' }
                  }
                  onMouseEnter={e => e.currentTarget.style.background = f.isActive ? '#fef2f2' : '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {f.isActive ? 'Өчүрүү' : 'Иштетүү'}
                </button>
                <button
                  onClick={() => openUsers(f)}
                  className="p-1.5 rounded-lg transition-all cursor-pointer"
                  style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  title="Кызматкерлер"
                >
                  <Users size={13} />
                </button>
                <button
                  onClick={() => openEdit(f)}
                  className="p-1.5 rounded-lg transition-all cursor-pointer"
                  style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  title="Өзгөртүү"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(f)}
                  className="p-1.5 rounded-lg transition-all cursor-pointer"
                  style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  title="Өчүрүү"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Фондду өзгөртүү' : 'Жаңы фонд кошуу'}>
        <div className="space-y-4">
          <Input label="Фонддун аты *" value={form.name} onChange={set('name')} placeholder="Karavan Ihlas" />
          <Input label="Slug *" value={form.slug} onChange={set('slug')} placeholder="karavan-ihlas" />
          <Input label="Телефон" value={form.phone} onChange={set('phone')} type="tel" />
          <Input label="Email" value={form.email} onChange={set('email')} type="email" />
          <Input label="Дарек" value={form.address} onChange={set('address')} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Жокко чыгаруу</Button>
            <Button onClick={handleSave} loading={saving}>{editTarget ? 'Сактоо' : 'Кошуу'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={cardStyle}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                <Trash2 size={18} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Фондду өчүрүү</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-500">Бул аракетти кайтаруу мүмкүн эмес.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Жокко чыгаруу</Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer"
                style={{ background: deleting ? '#fca5a5' : '#dc2626' }}
              >
                {deleting ? 'Өчүрүлүүдө...' : 'Өчүрүү'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {usersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" style={cardStyle}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Кызматкерлер</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{usersModal.name}</p>
              </div>
              <button
                onClick={() => setUsersModal(null)}
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Users list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {usersLoading ? (
                <Spinner />
              ) : users.length === 0 ? (
                <p className="text-[13px] text-slate-400 text-center py-6">Кызматкер жок</p>
              ) : (
                users.map((u) => (
                  <div key={u._id}>
                    {editingUser?._id === u._id ? (
                      /* Inline edit form */
                      <div className="rounded-xl p-3 space-y-2.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="Аты-жөнү" value={editUserForm.name} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} />
                          <Input label="Телефон" value={editUserForm.phone} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Input
                              label="Жаңы пароль (өзгөртүү үчүн)"
                              value={editUserForm.password}
                              onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))}
                              type={showEditPass ? 'text' : 'password'}
                              placeholder="Бош калтырса өзгөрбөйт"
                            />
                            <button type="button" onClick={() => setShowEditPass(v => !v)} className="absolute right-3 cursor-pointer" style={{ bottom: 9, color: '#94a3b8' }}>
                              {showEditPass ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[12px] font-medium text-slate-600">Роль</label>
                            <select
                              value={editUserForm.role}
                              onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}
                              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
                            >
                              <option value="fond_staff">Кызматкер</option>
                              <option value="fond_admin">Админ</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingUser(null)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer" style={{ color: '#64748b', background: '#fff', border: '1px solid #e2e8f0' }}>Жокко чыгаруу</button>
                          <Button onClick={handleUpdateUser} loading={savingUser}><Check size={13} /> Сактоо</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc' }}>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                          {u.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.phone}</p>
                        </div>
                        <Badge color={u.role === 'fond_admin' ? 'blue' : 'gray'}>
                          {u.role === 'fond_admin' ? 'Админ' : 'Кызматкер'}
                        </Badge>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                          style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          title="Өзгөртүү"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteUserTarget(u)}
                          className="p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                          style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          title="Өчүрүү"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add user form */}
            <div className="p-5 border-t border-slate-100 space-y-3">
              <p className="text-[12px] font-semibold text-slate-600">Жаңы кызматкер кошуу</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Аты-жөнү *" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Аты Фамилиясы" />
                <Input label="Телефон *" value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    label="Пароль *"
                    value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                    type={showPass ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 cursor-pointer"
                    style={{ bottom: 9, color: '#94a3b8' }}
                  >
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-slate-600">Роль</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
                  >
                    <option value="fond_staff">Кызматкер</option>
                    <option value="fond_admin">Админ</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddUser} loading={addingUser}>
                  <Plus size={13} /> Кошуу
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={cardStyle}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                <Trash2 size={18} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Кызматкерди өчүрүү</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{deleteUserTarget.name}</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-500">Бул аракетти кайтаруу мүмкүн эмес.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteUserTarget(null)}>Жокко чыгаруу</Button>
              <button
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer"
                style={{ background: deletingUser ? '#fca5a5' : '#dc2626' }}
              >
                {deletingUser ? 'Өчүрүлүүдө...' : 'Өчүрүү'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
