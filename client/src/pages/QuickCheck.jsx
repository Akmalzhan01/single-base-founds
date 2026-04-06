import { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DuplicateAlert from '../components/beneficiary/DuplicateAlert';

export default function QuickCheck() {
  const navigate = useNavigate();
  const [inn, setInn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    if (!inn) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/beneficiaries/check-inn', { inn });
      setResult(res.data);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pt-2 max-w-xl mx-auto">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Тездик текшерүү</h1>
        <p className="text-[13px] text-slate-400 mt-1">ИНН боюнча муктаж системада барбы текшериңиз</p>
      </div>

      <form
        onSubmit={check}
        className="rounded-2xl p-6 space-y-4"
        style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <Input
          label="Паспорттун ИНН сы"
          placeholder="ИНН киргизиңиз..."
          value={inn}
          onChange={(e) => { setInn(e.target.value); setChecked(false); setResult(null); }}
          required
        />
        <Button type="submit" loading={loading} className="w-full justify-center">
          <Search size={14} />
          Текшерүү
        </Button>
      </form>

      {checked && result && (
        <>
          {result.found ? (
            <DuplicateAlert
              data={result.data}
              aidRecords={result.aidRecords}
              onContinue={() => navigate('/create')}
              onCancel={() => { setResult(null); setChecked(false); setInn(''); }}
            />
          ) : (
            <div
              className="rounded-2xl p-5 flex items-start gap-3"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <CheckCircle size={18} style={{ color: '#16a34a', marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p className="text-[14px] font-semibold" style={{ color: '#15803d' }}>Системада жок</p>
                <p className="text-[13px] mt-0.5" style={{ color: '#16a34a' }}>Бул ИНН менен муктаж катталган эмес</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
