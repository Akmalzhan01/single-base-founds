import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import DuplicateAlert from '../../components/beneficiary/DuplicateAlert';
import ChildrenForm from '../../components/beneficiary/ChildrenForm';
import LocationPicker from '../../components/beneficiary/LocationPicker';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STATUSES = ['Карыя', 'Жесир', 'Майып', 'Зейнеткер', 'Жалгыз эне', 'Башка'];
const NEED_TYPES = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];
const CHILDREN_COUNTS = Array.from({ length: 12 }, (_, i) => String(i));
const GUARDIAN_TYPES = ['Жалгыз', 'Эри', 'Аялы', 'Балдары', 'Башка'];
const KYRGYZ_REGIONS = [
  'Бишкек ш.', 'Ош ш.', 'Чүй', 'Ош', 'Жалал-Абад', 'Баткен', 'Нарын', 'Талас', 'Ысык-Көл',
];

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

function Section({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="px-6 py-3.5" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

export default function BeneficiaryCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [innChecking, setInnChecking] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [innChecked, setInnChecked] = useState(false);
  const [forceSave, setForceSave] = useState(false);
  const [children, setChildren] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);
  const innTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(innTimerRef.current), []);

  const [form, setForm] = useState({
    inn: '', fullName: '', birthDate: '', address: '', phone: '',
    status: 'Карыя', needType: 'Азык-түүлүк', childrenCount: '0',
    guardianType: 'Жалгыз', comments: '',
    region: '', district: '', village: '',
    spouseRelation: '', spouseInn: '', spouseFullName: '',
    spouseBirthDate: '', spousePhone: '', spouseEmployed: '',
    clothingSize: '', shoeSize: '',
    spouseClothingSize: '', spouseShoeSize: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const checkInn = useCallback(async (inn) => {
    if (inn.length < 6) return;
    setInnChecking(true);
    try {
      const res = await api.post('/beneficiaries/check-inn', { inn });
      if (res.data.found) {
        setDuplicate({ data: res.data.data, aidRecords: res.data.aidRecords });
      } else {
        setDuplicate(null);
      }
      setInnChecked(true);
    } catch {
      setDuplicate(null);
    } finally {
      setInnChecking(false);
    }
  }, []);

  const handleInnChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, inn: val }));
    setInnChecked(false);
    setDuplicate(null);
    setForceSave(false);
    if (val.length >= 6) {
      clearTimeout(innTimerRef.current);
      innTimerRef.current = setTimeout(() => checkInn(val), 600);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duplicate && !forceSave) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('children', JSON.stringify(children));
      if (form.spouseFullName) {
        fd.append('spouse', JSON.stringify({
          relation: form.spouseRelation || 'Күйөөсу',
          inn: form.spouseInn,
          fullName: form.spouseFullName,
          birthDate: form.spouseBirthDate,
          phone: form.spousePhone,
          employed: form.spouseEmployed === 'true',
          clothingSize: form.spouseClothingSize,
          shoeSize: form.spouseShoeSize,
        }));
      }
      if (photoFile) fd.append('photo', photoFile);
      if (pinLat != null) fd.append('lat', pinLat);
      if (pinLng != null) fd.append('lng', pinLng);
      await api.post('/beneficiaries', fd);
      toast.success('Муктаж ийгиликтүү катталды!');
      navigate('/lists');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Жаңы муктаж кошуу</h1>
        <p className="text-[13px] text-slate-400 mt-1">Маалыматтарды толук жана туура толтуруңуз</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="Муктаж тууралуу маалымат">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Input
                label="Паспорттун ИНН сы *"
                placeholder="ИНН"
                value={form.inn}
                onChange={handleInnChange}
                required
              />
              {innChecking && (
                <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <Loader2 size={11} className="animate-spin" /> Текшерилүүдө...
                </p>
              )}
              {innChecked && !duplicate && !innChecking && (
                <p className="flex items-center gap-1.5 text-[12px]" style={{ color: '#10b981' }}>
                  <CheckCircle2 size={11} /> Системада жок
                </p>
              )}
            </div>
            <Input label="Ф. И. О *" placeholder="Фамилия Аты Атасынын аты" value={form.fullName} onChange={set('fullName')} required />
            <Input label="Туулган жылы" type="date" value={form.birthDate} onChange={set('birthDate')} />
          </div>

          {duplicate && !forceSave && (
            <DuplicateAlert
              data={duplicate.data}
              aidRecords={duplicate.aidRecords}
              onContinue={() => setForceSave(true)}
              onCancel={() => navigate('/lists')}
            />
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input label="Адресс" placeholder="Дареги" value={form.address} onChange={set('address')} />
            <Input label="Телефон" type="tel" placeholder="+996..." value={form.phone} onChange={set('phone')} />
            <Select label="Абалы" value={form.status} onChange={set('status')} options={toOptions(STATUSES)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select label="Муктаздыгы" value={form.needType} onChange={set('needType')} options={toOptions(NEED_TYPES)} />
            <Select label="Балдарынын саны" value={form.childrenCount} onChange={set('childrenCount')} options={CHILDREN_COUNTS.map(v => ({ value: v, label: v }))} />
            <Select label="Кимдин карамагында" value={form.guardianType} onChange={set('guardianType')} options={toOptions(GUARDIAN_TYPES)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Облус"
              value={form.region}
              onChange={set('region')}
              options={[{ value: '', label: '— Тандаңыз —' }, ...toOptions(KYRGYZ_REGIONS)]}
            />
            <Input label="Район" placeholder="Район" value={form.district} onChange={set('district')} />
            <Input label="Айыл / Кент" placeholder="Айыл" value={form.village} onChange={set('village')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Сүрөт / Документ
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="text-[13px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-[12px] file:font-medium file:bg-white file:text-slate-600 file:cursor-pointer hover:file:bg-slate-50 file:transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Комментарий</label>
              <textarea
                value={form.comments}
                onChange={set('comments')}
                rows={2}
                placeholder="Комментарий..."
                className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none transition-all text-slate-700 placeholder:text-slate-300"
                style={{ border: '1px solid #e2e8f0' }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>
        </Section>

        <Section title="Үй-бүлөсү тууралуу маалымат">
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Күйөөсу / Аялы"
              value={form.spouseRelation}
              onChange={set('spouseRelation')}
              options={[{ value: '', label: '— Тандаңыз —' }, { value: 'Күйөөсу', label: 'Күйөөсу' }, { value: 'Аялы', label: 'Аялы' }]}
            />
            <Input label="Паспорттун ИНН сы" placeholder="ИНН" value={form.spouseInn} onChange={set('spouseInn')} />
            <Input label="Ф. И. О" placeholder="Аты-жөнү" value={form.spouseFullName} onChange={set('spouseFullName')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Туулган жылы" type="date" value={form.spouseBirthDate} onChange={set('spouseBirthDate')} />
            <Input label="Телефон" type="tel" value={form.spousePhone} onChange={set('spousePhone')} />
            <Select
              label="Иштейт / Иштебейт"
              value={form.spouseEmployed}
              onChange={set('spouseEmployed')}
              options={[{ value: '', label: '— Тандаңыз —' }, { value: 'true', label: 'Иштейт' }, { value: 'false', label: 'Иштебейт' }]}
            />
          </div>
        </Section>

        <Section title="Балдары тууралуу маалымат">
          <ChildrenForm children={children} onChange={setChildren} />
        </Section>

        <Section title="Кийим өлчөмдөрү">
          <div className="space-y-1 mb-2">
            <p className="text-[12px] text-slate-400">Муктаж жана үй-бүлө мүчөлөрүнүн кийим өлчөмдөрүн жазыңыз</p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            {/* Header */}
            <div className="grid grid-cols-3 gap-0" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Аты-жөнү</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Кийим өлчөмү</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Бут кийим</div>
            </div>
            {/* Main person */}
            <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="px-4 py-3 flex items-center">
                <span className="text-[13px] text-slate-600 font-medium">{form.fullName || 'Муктаж'}</span>
              </div>
              <div className="px-3 py-2 border-l border-slate-100">
                <input
                  value={form.clothingSize}
                  onChange={set('clothingSize')}
                  placeholder="S, M, L, XL, 48..."
                  className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                  style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div className="px-3 py-2 border-l border-slate-100">
                <input
                  value={form.shoeSize}
                  onChange={set('shoeSize')}
                  placeholder="38, 42..."
                  className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                  style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            {/* Spouse row — only show if spouse name entered */}
            {form.spouseFullName && (
              <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="px-4 py-3 flex items-center">
                  <span className="text-[13px] text-slate-600">{form.spouseFullName}</span>
                </div>
                <div className="px-3 py-2 border-l border-slate-100">
                  <input
                    value={form.spouseClothingSize}
                    onChange={set('spouseClothingSize')}
                    placeholder="S, M, L, XL, 48..."
                    className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                    style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div className="px-3 py-2 border-l border-slate-100">
                  <input
                    value={form.spouseShoeSize}
                    onChange={set('spouseShoeSize')}
                    placeholder="38, 42..."
                    className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                    style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            )}
            {/* Children rows */}
            {children.map((child, i) => (
              <div key={i} className="grid grid-cols-3 gap-0" style={{ borderBottom: i < children.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300">{i + 1}</span>
                  <span className="text-[13px] text-slate-600">{child.fullName || `${i + 1}-бала`}</span>
                </div>
                <div className="px-3 py-2 border-l border-slate-100">
                  <input
                    value={child.clothingSize || ''}
                    onChange={e => {
                      const updated = [...children];
                      updated[i] = { ...updated[i], clothingSize: e.target.value };
                      setChildren(updated);
                    }}
                    placeholder="S, M, 92, 110..."
                    className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                    style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div className="px-3 py-2 border-l border-slate-100">
                  <input
                    value={child.shoeSize || ''}
                    onChange={e => {
                      const updated = [...children];
                      updated[i] = { ...updated[i], shoeSize: e.target.value };
                      setChildren(updated);
                    }}
                    placeholder="24, 36..."
                    className="w-full rounded-lg px-3 py-1.5 text-[13px] outline-none text-slate-700 placeholder:text-slate-300"
                    style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            ))}
            {children.length === 0 && !form.spouseFullName && (
              <div className="px-4 py-3 col-span-3">
                <p className="text-[12px] text-slate-300 italic">Үй-бүлө мүчөлөрүн кошуп, өлчөмдөрдү жазыңыз</p>
              </div>
            )}
          </div>
        </Section>

        <Section title="Картадагы жайгашкан орду (кошумча)">
          <LocationPicker
            lat={pinLat}
            lng={pinLng}
            onChange={(la, ln) => { setPinLat(la); setPinLng(ln); }}
          />
        </Section>

        <div className="flex justify-end gap-3 pb-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/lists')}>
            Жокко чыгаруу
          </Button>
          <Button type="submit" loading={loading} disabled={duplicate && !forceSave}>
            Сактоо
          </Button>
        </div>
      </form>
    </div>
  );
}
