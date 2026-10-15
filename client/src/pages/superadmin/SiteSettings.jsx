import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Globe, ExternalLink, Save, Plus, Trash2, ArrowUp, ArrowDown, ImagePlus, Loader2, Info, Eye, EyeOff,
} from 'lucide-react';
import api from '../../config/axios';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

// Сервер кабыл алган бөлүмдөр (siteController.EDITABLE)
const EDITABLE = ['foundation', 'brand', 'hero', 'about', 'directions', 'stats', 'donate', 'blog', 'contacts', 'links', 'sections', 'seo'];

const TABS = [
  { key: 'main', label: 'Негизги' },
  { key: 'about', label: 'Биз жөнүндө', section: 'about' },
  { key: 'directions', label: 'Багыттар', section: 'directions' },
  { key: 'stats', label: 'Сандар', section: 'stats' },
  { key: 'donate', label: 'Жардам берүү', section: 'donate' },
  { key: 'blog', label: 'Блог', section: 'blog' },
  { key: 'contacts', label: 'Байланыш', section: 'contacts' },
  { key: 'footer', label: 'Шилтемелер жана SEO' },
];

// site/assets/site.js ичиндеги ICON_PATHS менен бирдей ачкычтар
const ICONS = [
  ['food', 'Азык-түлүк'], ['medicine', 'Дары-дармек'], ['family', 'Үй-бүлө'], ['book', 'Китеп / билим'],
  ['education', 'Окуу'], ['heart', 'Жүрөк'], ['hands', 'Кайрымдуулук'], ['home', 'Үй / турак жай'],
  ['water', 'Суу'], ['clothes', 'Кийим'], ['mosque', 'Мечит'], ['trophy', 'Мелдеш / конкурс'],
];

const STAT_SOURCES = [
  ['manual', 'Колго жазам'],
  ['beneficiaries', 'Авто: катталган муктаждар'],
  ['aidCount', 'Авто: жардам жазуулары'],
  ['aidAmount', 'Авто: жардамдын суммасы (сом)'],
  ['foundations', 'Авто: активдүү фонддор'],
];

const pick = (obj) => Object.fromEntries(EDITABLE.map((k) => [k, obj?.[k]]));

// ── Жалпы талаалар ─────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
      {children}
      {hint && <span className="text-[11px] text-slate-400 leading-relaxed">{hint}</span>}
    </div>
  );
}

function TextArea({ label, hint, rows = 4, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={rows}
        className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-y transition-all text-slate-700 placeholder:text-slate-300 leading-relaxed"
        style={{ border: '1px solid #e2e8f0' }}
        onFocus={(e) => (e.target.style.borderColor = '#10b981')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        {...props}
      />
    </Field>
  );
}

function ImageField({ label, hint, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/site/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.url);
      toast.success('Сүрөт жүктөлдү');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Сүрөт жүктөлгөн жок. JPG же PNG форматын колдонуңуз.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-3 items-start">
        <div
          className="w-20 h-20 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={18} className="text-slate-300" />}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… же сүрөт жүктөңүз"
            className="w-full rounded-xl px-3.5 py-2 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
            style={{ border: '1px solid #e2e8f0' }}
          />
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => upload(e.target.files[0])} />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? 'Жүктөлүүдө…' : 'Сүрөт жүктөө'}
            </Button>
            {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>Алып салуу</Button>}
          </div>
        </div>
      </div>
    </Field>
  );
}

// Тизмени башкаруу: кошуу, өчүрүү, иретин өзгөртүү
function ListEditor({ items, onChange, empty, addLabel, newItem, render }) {
  const list = items || [];
  const move = (i, d) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {list.length === 0 && <p className="text-[13px] text-slate-400 py-2">{empty}</p>}
      {list.map((item, i) => (
        <div key={i} className="rounded-xl p-4 flex gap-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div className="flex-1 min-w-0 space-y-3">
            {render(item, (patch) => onChange(list.map((x, j) => (j === i ? (typeof patch === 'object' && patch !== null && !Array.isArray(patch) ? { ...x, ...patch } : patch) : x))), i)}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" title="Өйдө"><ArrowUp size={14} /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-1.5 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" title="Төмөн"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer" style={{ color: '#ef4444' }} title="Өчүрүү"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...list, newItem()])}>
        <Plus size={13} /> {addLabel}
      </Button>
    </div>
  );
}

function SectionToggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="inline-flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
      style={value
        ? { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }
        : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
    >
      {value ? <Eye size={13} /> : <EyeOff size={13} />}
      {value ? 'Сайтта көрүнөт' : 'Жашырылган'}
    </button>
  );
}

// ── Барак ─────────────────────────────────────────────────────
export default function SiteSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [isSample, setIsSample] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [foundations, setFoundations] = useState([]);
  const [tab, setTab] = useState('main');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.isSuperadmin) return;
    Promise.all([api.get('/site'), api.get('/foundations').catch(() => ({ data: { data: [] } }))])
      .then(([s, f]) => {
        const data = pick(s.data.data);
        setForm(data);
        setSaved(data);
        setIsSample(s.data.data.isSample);
        setSiteUrl(s.data.siteUrl);
        setFoundations(f.data.data || []);
      })
      .catch(() => toast.error('Сайттын маалыматы жүктөлгөн жок'));
  }, [user]);

  const dirty = useMemo(() => form && saved && JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Сакталбаган өзгөртүүлөр менен барактан чыкканда эскертүү
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!user?.isSuperadmin) {
    return <div className="py-24 text-center text-[13px] text-slate-400">Бул барак суперадмин үчүн гана</div>;
  }
  if (!form) return <Spinner />;

  // set('hero.title', 'текст') — терең жолду өзгөртөт
  const set = (path, value) => setForm((prev) => {
    const next = structuredClone(prev);
    const keys = path.split('.');
    let obj = next;
    keys.slice(0, -1).forEach((k) => { obj[k] = obj[k] ?? {}; obj = obj[k]; });
    obj[keys[keys.length - 1]] = value;
    return next;
  });
  const bind = (path) => ({
    value: path.split('.').reduce((o, k) => o?.[k], form) ?? '',
    onChange: (e) => set(path, e.target.value),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/site', form);
      const data = pick(res.data.data);
      setForm(data);
      setSaved(data);
      setIsSample(false);
      toast.success('Сакталды — сайт жаңыланды');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Сактоодо ката кетти');
    } finally {
      setSaving(false);
    }
  };

  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Сайт</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Фонддун визитка сайтынын мазмуну. Сактагандан кийин сайтта дароо чыгат.</p>
        </div>
        <div className="flex items-center gap-2">
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <ExternalLink size={13} /> Сайтты ачуу
            </a>
          )}
          <Button onClick={handleSave} loading={saving} disabled={!dirty || saving}>
            <Save size={13} /> {dirty ? 'Сактоо' : 'Сакталган'}
          </Button>
        </div>
      </div>

      {isSample && (
        <div className="rounded-xl px-4 py-3 flex gap-2.5 text-[13px]" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
          <Info size={15} className="shrink-0 mt-0.5" />
          <span>Сайтта азыр үлгү текст турат. Фонддун чыныгы маалыматын киргизип, «Сактоо» баскычын басыңыз.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = t.key === tab;
          const hidden = t.section && !form.sections?.[t.section];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
              style={active
                ? { background: '#10b981', color: '#fff' }
                : { background: '#fff', color: hidden ? '#cbd5e1' : '#64748b', border: '1px solid #e2e8f0' }}
              title={hidden ? 'Бул бөлүм сайтта жашырылган' : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
        {current.section && (
          <div className="flex items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <span className="text-[13px] text-slate-500">Бул бөлүм сайтта:</span>
            <SectionToggle value={!!form.sections?.[current.section]} onChange={(v) => set(`sections.${current.section}`, v)} />
          </div>
        )}

        {tab === 'main' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Фонддун аты" {...bind('brand.name')} />
              <Input label="Кыскача аныктама" placeholder="Кайрымдуулук фонду" {...bind('brand.tagline')} />
            </div>
            <ImageField label="Логотип" hint="Бош болсо — сайттын өз белгиси колдонулат. PNG (тунук фон) сунушталат." value={form.brand?.logo} onChange={(v) => set('brand.logo', v)} />
            <Select
              label="Сайт кайсы фондго тиешелүү"
              value={form.foundation || ''}
              onChange={(e) => set('foundation', e.target.value || null)}
              options={[{ value: '', label: 'Бардык фонддор (бүт платформа)' }, ...foundations.map((f) => ({ value: f._id, label: f.name }))]}
            />
            <p className="text-[11px] text-slate-400 -mt-3">Блогдогу посттор жана автоматтык сандар ушул фонд боюнча алынат.</p>

            <div className="pt-2 space-y-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <p className="text-[13px] font-semibold text-slate-700 pt-3">Баш бөлүм (сайт ачылганда биринчи көрүнөт)</p>
              <Input label="Аталыш" {...bind('hero.title')} />
              <TextArea label="Текст" rows={3} {...bind('hero.text')} />
              <ImageField label="Сүрөт (арка ичинде)" hint="Бош болсо — оймо-чийме көрүнөт. Тик (вертикал) сүрөт жакшы чыгат." value={form.hero?.image} onChange={(v) => set('hero.image', v)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Негизги баскыч" {...bind('hero.primaryCta.label')} />
                <Input label="Негизги баскычтын шилтемеси" placeholder="#donate" {...bind('hero.primaryCta.href')} />
                <Input label="Экинчи баскыч" {...bind('hero.secondaryCta.label')} />
                <Input label="Экинчи баскычтын шилтемеси" placeholder="#about" {...bind('hero.secondaryCta.href')} />
              </div>
              <p className="text-[11px] text-slate-400">Бөлүмгө шилтеме: #about, #directions, #donate, #blog, #contacts. Баскычты жашыруу үчүн атын бош калтырыңыз.</p>
            </div>
          </>
        )}

        {tab === 'about' && (
          <>
            <Input label="Аталыш" {...bind('about.title')} />
            <TextArea label="Текст" rows={8} hint="Абзацтарды бош сап менен бөлүңүз." {...bind('about.text')} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Түзүлгөн жылы" placeholder="2019" {...bind('about.foundedYear')} />
            </div>
            <ImageField label="Сүрөт" value={form.about?.image} onChange={(v) => set('about.image', v)} />
          </>
        )}

        {tab === 'directions' && (
          <>
            <Input label="Бөлүмдүн аталышы" {...bind('directions.title')} />
            <ListEditor
              items={form.directions?.items}
              onChange={(v) => set('directions.items', v)}
              empty="Багыттар жок. Фонд эмне менен алектенерин кошуңуз."
              addLabel="Багыт кошуу"
              newItem={() => ({ icon: 'heart', title: '', text: '' })}
              render={(item, update) => (
                <>
                  <div className="grid sm:grid-cols-[180px_1fr] gap-3">
                    <Select label="Белги" value={item.icon} onChange={(e) => update({ icon: e.target.value })} options={ICONS.map(([v, l]) => ({ value: v, label: l }))} />
                    <Input label="Аталыш" value={item.title || ''} onChange={(e) => update({ title: e.target.value })} />
                  </div>
                  <TextArea label="Кыскача" rows={2} value={item.text || ''} onChange={(e) => update({ text: e.target.value })} />
                </>
              )}
            />
          </>
        )}

        {tab === 'stats' && (
          <>
            <Input label="Бөлүмдүн аталышы" {...bind('stats.title')} />
            <ListEditor
              items={form.stats?.items}
              onChange={(v) => set('stats.items', v)}
              empty="Сандар жок."
              addLabel="Сан кошуу"
              newItem={() => ({ label: '', value: '', source: 'manual' })}
              render={(item, update) => (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Select label="Маани" value={item.source || 'manual'} onChange={(e) => update({ source: e.target.value })} options={STAT_SOURCES.map(([v, l]) => ({ value: v, label: l }))} />
                  {(item.source || 'manual') === 'manual'
                    ? <Input label="Сан" placeholder="500+" value={item.value || ''} onChange={(e) => update({ value: e.target.value })} />
                    : <Field label="Сан"><p className="text-[13px] text-slate-400 py-2.5">FundsDB'ден автоматтык</p></Field>}
                  <Input label="Түшүндүрмө" placeholder="үй-бүлөгө жардам берилди" value={item.label || ''} onChange={(e) => update({ label: e.target.value })} />
                </div>
              )}
            />
            <p className="text-[11px] text-slate-400">Автоматтык сандар FundsDB'деги маалыматтан эсептелет жана мүнөт сайын жаңыланат.</p>
          </>
        )}

        {tab === 'donate' && (
          <>
            <Input label="Аталыш" {...bind('donate.title')} />
            <TextArea label="Текст" rows={3} {...bind('donate.text')} />
            <ListEditor
              items={form.donate?.methods}
              onChange={(v) => set('donate.methods', v)}
              empty="Реквизиттер кошула элек — сайтта «биз менен байланышыңыз» деген жазуу чыгат."
              addLabel="Реквизит кошуу"
              newItem={() => ({ name: '', details: '', note: '' })}
              render={(item, update) => (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input label="Аталышы" placeholder="MBank" value={item.name || ''} onChange={(e) => update({ name: e.target.value })} />
                  <Input label="Номер / эсеп" placeholder="0700 123 456" value={item.details || ''} onChange={(e) => update({ details: e.target.value })} />
                  <Input label="Эскертме" placeholder="Алуучу: …" value={item.note || ''} onChange={(e) => update({ note: e.target.value })} />
                </div>
              )}
            />
          </>
        )}

        {tab === 'blog' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Аталыш" {...bind('blog.title')} />
              <Select
                label="Башкы бетте канча пост"
                value={String(form.blog?.limit || 3)}
                onChange={(e) => set('blog.limit', Number(e.target.value))}
                options={[3, 6, 9].map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
            <div className="rounded-xl px-4 py-3 text-[13px] text-slate-600 flex gap-2.5" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Info size={15} className="shrink-0 mt-0.5 text-slate-400" />
              <span>
                Посттор FundsDB'деги <Link to="/blog" className="text-emerald-600 font-medium underline">Блог</Link> барагынан кошулат.
                Ошол жерде жарыяланган посттор сайтта автоматтык чыгат{form.foundation ? ' (тандалган фонддуку гана)' : ''}.
              </span>
            </div>
          </>
        )}

        {tab === 'contacts' && (
          <>
            <Input label="Аталыш" {...bind('contacts.title')} />
            <TextArea label="Дарек" rows={2} {...bind('contacts.address')} />
            <Field label="Телефондор">
              <ListEditor
                items={form.contacts?.phones}
                onChange={(v) => set('contacts.phones', v)}
                empty="Телефон кошула элек."
                addLabel="Телефон кошуу"
                newItem={() => ''}
                render={(item, update) => (
                  <Input placeholder="+996 700 123 456" value={item || ''} onChange={(e) => update(e.target.value)} />
                )}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Электрондук почта" type="email" {...bind('contacts.email')} />
              <Input label="WhatsApp номери" placeholder="+996 700 123 456" {...bind('contacts.whatsapp')} />
              <Input label="Telegram" placeholder="@username же шилтеме" {...bind('contacts.telegram')} />
              <Input label="Instagram" placeholder="@username же шилтеме" {...bind('contacts.instagram')} />
              <Input label="Facebook" placeholder="https://facebook.com/…" {...bind('contacts.facebook')} />
              <Input label="YouTube" placeholder="https://youtube.com/@…" {...bind('contacts.youtube')} />
              <Input label="TikTok" placeholder="@username" {...bind('contacts.tiktok')} />
            </div>
            <TextArea
              label="Карта"
              rows={2}
              hint="Google Maps → дарекке кирип → «Бөлүшүү» → «Картаны кыстаруу» → кодду толугу менен ушул жерге чаптаңыз. Жөнөкөй шилтеме чаптасаңыз, «Картадан ачуу» деген шилтеме чыгат."
              {...bind('contacts.mapUrl')}
            />
          </>
        )}

        {tab === 'footer' && (
          <>
            <Field label="Футердеги шилтемелер">
              <ListEditor
                items={form.links}
                onChange={(v) => set('links', v)}
                empty="Шилтемелер жок."
                addLabel="Шилтеме кошуу"
                newItem={() => ({ label: '', href: '' })}
                render={(item, update) => (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input label="Аты" value={item.label || ''} onChange={(e) => update({ label: e.target.value })} />
                    <Input label="Шилтеме" placeholder="https://…" value={item.href || ''} onChange={(e) => update({ href: e.target.value })} />
                  </div>
                )}
              />
            </Field>
            <div className="pt-2 space-y-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <p className="text-[13px] font-semibold text-slate-700 pt-3 flex items-center gap-2"><Globe size={14} /> Издөө системалары жана соцтармактар</p>
              <Input label="Сайттын аталышы (браузердин өтмөгүндө)" placeholder={`${form.brand?.name || ''} — ${form.brand?.tagline || ''}`} {...bind('seo.title')} />
              <TextArea label="Сүрөттөмө" rows={2} placeholder="Бош болсо — баш бөлүмдүн тексти колдонулат" {...bind('seo.description')} />
              <ImageField label="Бөлүшкөндө чыгуучу сүрөт" hint="Telegram, WhatsApp, Facebook'ко шилтеме ташталганда чыгат. 1200×630 өлчөм сунушталат." value={form.seo?.image} onChange={(v) => set('seo.image', v)} />
            </div>
          </>
        )}
      </div>

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="rounded-xl px-4 py-2.5 flex items-center gap-3 text-[13px]" style={{ background: '#0d0d18', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            Сакталбаган өзгөртүүлөр бар
            <Button size="sm" onClick={handleSave} loading={saving}><Save size={13} /> Сактоо</Button>
          </div>
        </div>
      )}
    </div>
  );
}
