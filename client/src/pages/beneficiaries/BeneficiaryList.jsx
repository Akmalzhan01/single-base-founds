import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

const needColors = {
  'Азык-түүлүк': 'green', 'Дары-дармек': 'blue', 'Акча': 'yellow',
  'Кийим': 'purple', 'Мэбел': 'gray', 'Башка': 'gray',
};

const NEED_TYPES = ['', 'Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];
const STATUSES = ['', 'Карыя', 'Жесир', 'Майып', 'Зейнеткер', 'Жалгыз эне', 'Башка'];
const REGIONS = ['', 'Бишкек ш.', 'Ош ш.', 'Чүй', 'Ош', 'Жалал-Абад', 'Баткен', 'Нарын', 'Талас', 'Ысык-Көл'];

const avatarColors = [
  ['#3b82f6', '#6366f1'], ['#a855f7', '#7c3aed'], ['#f43f5e', '#db2777'],
  ['#f59e0b', '#f97316'], ['#10b981', '#059669'], ['#06b6d4', '#0284c7'],
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getAvatarColors(name = '') {
  let s = 0; for (const c of name) s += c.charCodeAt(0);
  return avatarColors[s % avatarColors.length];
}

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

export default function BeneficiaryList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', needType: '', region: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search, ...filters };
      const res = await api.get('/beneficiaries', { params });
      setData(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      setData([]);
      toast.error('Маалымат жүктөлгөн жок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, filters, page]);

  const setFilter = (k) => (e) => {
    setFilters((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ search, ...filters });
    Object.keys(params).forEach(k => !params.get(k) && params.delete(k));
    const url = `/api/beneficiaries/export?${params}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muktajdar.xlsx';
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Муктаждар</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Жалпы {total} адам катталган</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-xl cursor-pointer transition-all"
          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
          onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
          onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
          title="Excel форматында жүктөп алуу"
        >
          <Download size={13} />
          Excel
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 flex gap-3 flex-wrap items-center" style={cardStyle}>
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Filter size={14} />
          <span className="text-[12px] font-medium">Чыпка</span>
        </div>
        <div className="w-px h-5 bg-slate-100 shrink-0" />
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Аты же ИНН боюнча..."
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <select
          value={filters.status}
          onChange={setFilter('status')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
        >
          {STATUSES.map((v) => (
            <option key={v} value={v}>{v || 'Бардык абалдар'}</option>
          ))}
        </select>
        <select
          value={filters.needType}
          onChange={setFilter('needType')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
        >
          {NEED_TYPES.map((v) => (
            <option key={v} value={v}>{v || 'Бардык муктаздыктар'}</option>
          ))}
        </select>
        <select
          value={filters.region}
          onChange={setFilter('region')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
        >
          {REGIONS.map((v) => (
            <option key={v} value={v}>{v || 'Бардык аймактар'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-300 text-[13px]">Маалымат жок</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Аты-жөнү</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ИНН</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Телефон</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Муктаздыгы</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Абалы</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Фонд</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Катталган</th>
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {data.map((b, i) => {
                const [c1, c2] = getAvatarColors(b.fullName);
                return (
                  <tr
                    key={b._id}
                    onClick={() => navigate(`/beneficiaries/${b._id}`)}
                    className="cursor-pointer transition-colors group"
                    style={{ borderBottom: i < data.length - 1 ? '1px solid #f8fafc' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafffe'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[11px] font-semibold"
                          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                        >
                          {getInitials(b.fullName)}
                        </div>
                        <span className="font-medium text-slate-700">{b.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-slate-400">{b.inn}</td>
                    <td className="px-4 py-3.5 text-slate-500">{b.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge color={needColors[b.needType] || 'gray'}>{b.needType}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[12px]">{b.status}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[12px]">{b.registeredBy?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[12px]">
                      {new Date(b.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`/api/beneficiaries/${b._id}/pdf`, '_blank'); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="PDF жүктөп алуу"
                      >
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}
