import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import api from '../../config/axios';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const AID_TYPES = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];

export default function AidModal({ beneficiaryId, onClose, onSaved }) {
  const [form, setForm] = useState({
    aidType: 'Азык-түүлүк', amount: '', description: '', notes: '',
    givenAt: new Date().toISOString().split('T')[0],
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview(null);
    fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.description) return toast.error('Сүрөттөмө жазыңыз');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('beneficiary', beneficiaryId);
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo);

      await api.post('/aid-records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Жардам жазылды');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ката кетти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Жардам жазуу">
      <div className="space-y-4">
        <Select label="Жардамдын түрү" value={form.aidType} onChange={set('aidType')} options={AID_TYPES.map(v => ({ value: v, label: v }))} />
        <Input label="Суммасы (сом)" type="number" placeholder="0" value={form.amount} onChange={set('amount')} />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Сүрөттөмө *
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            placeholder="Кандай жардам берилди..."
            className="rounded-xl px-4 py-3 text-[14px] text-slate-700 outline-none resize-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <Input label="Берилген күнү" type="date" value={form.givenAt} onChange={set('givenAt')} />
        <Input label="Эскертме" placeholder="Кошумча маалымат..." value={form.notes} onChange={set('notes')} />

        {/* Photo upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Сүрөт (милдеттүү эмес)
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {preview ? (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 160 }}>
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="w-full rounded-xl flex items-center justify-center gap-2 py-4 transition-all cursor-pointer"
              style={{ border: '1.5px dashed #e2e8f0', color: '#94a3b8' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <ImagePlus size={16} />
              <span className="text-[13px] font-medium">Сүрөт тандоо</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 pt-1 justify-end">
          <Button variant="secondary" onClick={onClose} type="button">Жокко чыгаруу</Button>
          <Button onClick={handleSave} loading={loading}>Сактоо</Button>
        </div>
      </div>
    </Modal>
  );
}
