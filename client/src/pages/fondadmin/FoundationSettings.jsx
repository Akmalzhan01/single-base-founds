import { useEffect, useState } from 'react';
import { Building2, Save, Bot, Phone, Mail, MapPin, Tag } from 'lucide-react';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-[13px] outline-none transition-all';
const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' };
const inputFocusStyle = { border: '1px solid #3b82f6', background: '#fff' };

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {Icon && <Icon size={11} />} {label}
      </label>
      {children}
    </div>
  );
}

export default function FoundationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', telegramChatId: '' });

  useEffect(() => {
    api.get('/foundations/mine')
      .then(r => {
        const d = r.data.data;
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          telegramChatId: d.telegramChatId || '',
        });
      })
      .catch(() => toast.error('Маалымат жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, []);

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Фонддун аты бош болбосун');
    setSaving(true);
    try {
      await api.put('/foundations/mine', form);
      toast.success('Өзгөртүүлөр сакталды');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Building2 size={20} style={{ color: '#10b981' }} /> Фонд жөндөөлөрү
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Фонддун жалпы маалыматын жаңылаңыз</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest pb-1"
            style={{ borderBottom: '1px solid #f1f5f9' }}>Негизги маалымат</p>

          <Field label="Фонддун аты" icon={Tag}>
            <input className={inputCls} style={inputStyle} placeholder="Karavan Ihlas"
              value={form.name} onChange={set('name')}
              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={e => Object.assign(e.target.style, inputStyle)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Телефон" icon={Phone}>
              <input className={inputCls} style={inputStyle} placeholder="+996 555 000 000"
                value={form.phone} onChange={set('phone')}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.target.style, inputStyle)} />
            </Field>
            <Field label="Email" icon={Mail}>
              <input className={inputCls} style={inputStyle} placeholder="info@fond.kg" type="email"
                value={form.email} onChange={set('email')}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => Object.assign(e.target.style, inputStyle)} />
            </Field>
          </div>

          <Field label="Дарек" icon={MapPin}>
            <input className={inputCls} style={inputStyle} placeholder="Бишкек ш., Чуй проспекти 42"
              value={form.address} onChange={set('address')}
              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={e => Object.assign(e.target.style, inputStyle)} />
          </Field>
        </div>

        <div className="rounded-2xl p-6 space-y-4 mt-4" style={cardStyle}>
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest pb-1"
            style={{ borderBottom: '1px solid #f1f5f9' }}>Telegram Bot</p>

          <Field label="Telegram Chat ID" icon={Bot}>
            <input className={inputCls} style={inputStyle} placeholder="-100123456789"
              value={form.telegramChatId} onChange={set('telegramChatId')}
              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={e => Object.assign(e.target.style, inputStyle)} />
          </Field>

          <div className="rounded-xl p-3 text-[12px] text-slate-500" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="font-semibold text-slate-600 mb-1">Chat ID кантип табуу керек?</p>
            <ol className="space-y-0.5 list-decimal list-inside">
              <li>Telegram'да @userinfobot'ка жазыңыз → өзүңүздүн ID аласыз</li>
              <li>Топ чат ID үчүн: топко @userinfobot кошуп, каалаган билдирүүнү жиберип, forward'лаңыз</li>
              <li>Топ ID'си адатта <span className="font-mono text-slate-700">-100...</span> менен башталат</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-all"
            style={{ background: '#10b981', opacity: saving ? 0.7 : 1, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#10b981'; }}
          >
            <Save size={14} />
            {saving ? 'Сакталууда...' : 'Өзгөртүүлөрдү сактоо'}
          </button>
        </div>
      </form>
    </div>
  );
}
