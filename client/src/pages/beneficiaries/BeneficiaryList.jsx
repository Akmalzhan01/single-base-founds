import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Download, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { toNeedTypes } from '../../utils/needType';
import { VERIFICATION_STATUSES } from '../../utils/verificationStatus';
import { LIST_STATE_KEY } from '../../utils/listState';
import VerificationBadge from '../../components/beneficiary/VerificationBadge';
import { useCategories } from '../../context/CategoriesContext';
const REGIONS = ['', 'Бишкек ш.', 'Ош ш.', 'Чүй', 'Ош', 'Жалал-Абад', 'Баткен', 'Нарын', 'Талас', 'Ысык-Көл'];

// Сервердеги aid параметринин маанилери (beneficiaryController.aidFilter)
const AID_FILTERS = [
  { label: null, options: [['', 'Жардам: баары'], ['received', 'Жардам алгандар'], ['never', 'Эч жардам албагандар']] },
  { label: 'Акыркы ... күндө жардам алгандар', options: [7, 15, 20, 30, 60, 90].map((d) => [`within:${d}`, `Акыркы ${d} күндө алгандар`]) },
  { label: 'Акыркы ... күндө жардам албагандар', options: [30, 60, 90, 180].map((d) => [`notWithin:${d}`, `${d} күндөн бери албагандар`]) },
];

const FILTER_KEYS = ['verificationStatus', 'status', 'needType', 'region', 'aid'];

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

const daysAgo = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

function LastAid({ date, count }) {
  if (!date) return <span className="text-[12px] text-slate-300">Алган эмес</span>;
  const d = daysAgo(date);
  const color = d <= 30 ? '#10b981' : d <= 90 ? '#d97706' : '#94a3b8';
  return (
    <div className="leading-tight">
      <p className="text-[12px] font-medium" style={{ color }}>
        {d === 0 ? 'Бүгүн' : `${d} күн мурун`}
      </p>
      <p className="text-[11px] text-slate-400">
        {new Date(date).toLocaleDateString('ru-RU')} · {count} жолу
      </p>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const selectStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' };
const activeSelectStyle = { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' };

export default function BeneficiaryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { list, colorOf } = useCategories();
  // Чыпкалар жана барак URL'да сакталат — профилден артка кайтканда жоголбойт
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Number(params.get('limit')) || 20;
  const q = params.get('q') || '';
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const hasFilters = !!q || FILTER_KEYS.some((k) => filters[k]);

  // Издөө талаасы жергиликтүү, URL'га кечигүү менен жазылат
  const [search, setSearch] = useState(q);

  const update = (patch, { keepPage = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
      if (!keepPage) next.delete('page');
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (search.trim() === q) return;
    const t = setTimeout(() => update({ q: search.trim() }), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { sessionStorage.setItem(LIST_STATE_KEY, location.search); } catch { /* storage жок */ }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = { page, limit, search: q, ...filters };
    Object.keys(query).forEach((k) => !query[k] && delete query[k]);
    api.get('/beneficiaries', { params: query })
      .then((res) => {
        if (cancelled) return;
        // Барак саны азайып калса (мисалы, өчүрүүдөн кийин) — акыркы бар баракка өтөбүз
        if (page > res.data.pages) {
          update({ page: res.data.pages > 1 ? res.data.pages : '' }, { keepPage: true });
          return;
        }
        setData(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .catch(() => { if (!cancelled) { setData([]); toast.error('Маалымат жүктөлгөн жок'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (k) => (e) => update({ [k]: e.target.value });

  const resetFilters = () => {
    setSearch('');
    setParams(limit !== 20 ? { limit: String(limit) } : {}, { replace: true });
  };

  const handleExport = () => {
    const query = new URLSearchParams({ search: q, ...filters });
    [...query.keys()].forEach(k => !query.get(k) && query.delete(k));
    const url = `/api/beneficiaries/export?${query}`;
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
          <p className="text-[13px] text-slate-400 mt-0.5">
            {hasFilters ? `Чыпка боюнча табылды: ${total}` : `Жалпы ${total} адам катталган`}
          </p>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Аты, ИНН же телефон боюнча..."
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <select
          value={filters.aid}
          onChange={setFilter('aid')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={filters.aid ? activeSelectStyle : selectStyle}
        >
          {AID_FILTERS.map((group, gi) => {
            const opts = group.options.map(([v, label]) => <option key={v} value={v}>{label}</option>);
            return group.label ? <optgroup key={gi} label={group.label}>{opts}</optgroup> : opts;
          })}
        </select>
        <select
          value={filters.verificationStatus}
          onChange={setFilter('verificationStatus')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={filters.verificationStatus ? activeSelectStyle : selectStyle}
        >
          {['', ...VERIFICATION_STATUSES].map((v) => (
            <option key={v} value={v}>{v || 'Бардык текшерүүлөр'}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={setFilter('status')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={filters.status ? activeSelectStyle : selectStyle}
        >
          {['', ...list('status', filters.status)].map((v) => (
            <option key={v} value={v}>{v || 'Бардык абалдар'}</option>
          ))}
        </select>
        <select
          value={filters.needType}
          onChange={setFilter('needType')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={filters.needType ? activeSelectStyle : selectStyle}
        >
          {['', ...list('needType', filters.needType)].map((v) => (
            <option key={v} value={v}>{v || 'Бардык муктаздыктар'}</option>
          ))}
        </select>
        <select
          value={filters.region}
          onChange={setFilter('region')}
          className="rounded-xl px-3 py-2 text-[13px] outline-none transition-all cursor-pointer"
          style={filters.region ? activeSelectStyle : selectStyle}
        >
          {REGIONS.map((v) => (
            <option key={v} value={v}>{v || 'Бардык аймактар'}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-2 rounded-xl cursor-pointer transition-all text-slate-500 hover:bg-slate-100"
            title="Бардык чыпкаларды тазалоо"
          >
            <X size={13} />
            Тазалоо
          </button>
        )}
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
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Аты-жөнү</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ИНН</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Телефон</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Муктаздыгы</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Абалы</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Текшерүү</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Акыркы жардам</th>
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
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{b.phone || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {toNeedTypes(b.needType).map((n) => (
                            <Badge key={n} color={colorOf('needType', n)}>{n}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {b.status ? <Badge color={colorOf('status', b.status)}>{b.status}</Badge> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <VerificationBadge value={b.verificationStatus} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <LastAid date={b.lastAidAt} count={b.aidCount} />
                      </td>
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
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        limit={limit}
        onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })}
        onLimitChange={(l) => update({ limit: l !== 20 ? l : '' })}
      />
    </div>
  );
}
