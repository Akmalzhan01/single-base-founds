import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ChildrenForm from '../../components/beneficiary/ChildrenForm';
import LocationPicker from '../../components/beneficiary/LocationPicker';
import Spinner from '../../components/ui/Spinner';

const STATUSES = ['Карыя', 'Жесир', 'Майып', 'Зейнеткер', 'Жалгыз эне', 'Башка'];
const NEED_TYPES = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];
const CHILDREN_COUNTS = Array.from({ length: 12 }, (_, i) => String(i));
const GUARDIAN_TYPES = ['Жалгыз', 'Эри', 'Аялы', 'Балдары', 'Башка'];
const KYRGYZ_REGIONS = [
  'Бишкек ш.', 'Ош ш.', 'Чүй', 'Ош', 'Жалал-Абад', 'Баткен', 'Нарын', 'Талас', 'Ысык-Көл',
];

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
const fmt = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

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

export default function BeneficiaryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [children, setChildren] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);

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

  useEffect(() => {
    api.get(`/beneficiaries/${id}`)
      .then(res => {
        const d = res.data.data;
        setForm({
          inn: d.inn || '',
          fullName: d.fullName || '',
          birthDate: fmt(d.birthDate),
          address: d.address || '',
          phone: d.phone || '',
          status: d.status || 'Карыя',
          needType: d.needType || 'Азык-түүлүк',
          childrenCount: String(d.childrenCount ?? 0),
          guardianType: d.guardianType || 'Жалгыз',
          comments: d.comments || '',
          region: d.region || '',
          district: d.district || '',
          village: d.village || '',
          spouseRelation: d.spouse?.relation || '',
          spouseInn: d.spouse?.inn || '',
          spouseFullName: d.spouse?.fullName || '',
          spouseBirthDate: fmt(d.spouse?.birthDate),
          spousePhone: d.spouse?.phone || '',
          spouseEmployed: d.spouse?.employed != null ? String(d.spouse.employed) : '',
          clothingSize: d.clothingSize || '',
          shoeSize: d.shoeSize || '',
          spouseClothingSize: d.spouse?.clothingSize || '',
          spouseShoeSize: d.spouse?.shoeSize || '',
        });
        setChildren(d.children || []);
        setCurrentPhoto(d.photo || null);
        if (d.lat != null) setPinLat(d.lat);
        if (d.lng != null) setPinLng(d.lng);
      })
      .catch(() => toast.error('Маалымат жүктөлгөн жок'))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await api.put(`/beneficiaries/${id}`, fd);
      toast.success('Маалыматтар сакталды!');
      navigate(`/beneficiaries/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Spinner />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Маалыматтарды өзгөртүү</h1>
        <p className="text-[13px] text-slate-400 mt-1 font-mono">{form.inn}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="Муктаж тууралуу маалымат">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Паспорттун ИНН сы *" value={form.inn} onChange={set('inn')} required />
            <Input label="Ф. И. О *" value={form.fullName} onChange={set('fullName')} required />
            <Input label="Туулган жылы" type="date" value={form.birthDate} onChange={set('birthDate')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Адресс" value={form.address} onChange={set('address')} />
            <Input label="Телефон" type="tel" value={form.phone} onChange={set('phone')} />
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
            <Input label="Район" value={form.district} onChange={set('district')} />
            <Input label="Айыл / Кент" value={form.village} onChange={set('village')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Сүрөт / Документ
              </label>
              {currentPhoto && !photoFile && (
                <img src={currentPhoto} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
              )}
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
                className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none text-slate-700 placeholder:text-slate-300"
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
            <Input label="Паспорттун ИНН сы" value={form.spouseInn} onChange={set('spouseInn')} />
            <Input label="Ф. И. О" value={form.spouseFullName} onChange={set('spouseFullName')} />
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
            <div className="grid grid-cols-3 gap-0" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Аты-жөнү</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Кийим өлчөмү</div>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Бут кийим</div>
            </div>
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
          <Button type="button" variant="secondary" onClick={() => navigate(`/beneficiaries/${id}`)}>
            Жокко чыгаруу
          </Button>
          <Button type="submit" loading={loading}>
            Сактоо
          </Button>
        </div>
      </form>
    </div>
  );
}
