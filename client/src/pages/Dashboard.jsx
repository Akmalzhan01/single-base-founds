import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, TrendingUp, Building2, ArrowRight, Calendar, MapPin, Banknote } from 'lucide-react';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

const STATUS_LABELS = {
  'Карыя': '#3b82f6',
  'Жесир': '#a855f7',
  'Майып': '#f59e0b',
  'Зейнеткер': '#10b981',
  'Жалгыз эне': '#f43f5e',
  'Башка': '#94a3b8',
};

function StatCard({ label, value, icon: Icon, from, to, sub }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={cardStyle}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 4px 12px ${from}40` }}
        >
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
        {sub != null && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#10b981' }}>
            +{sub} бул ай
          </span>
        )}
      </div>
      <div>
        <p className="text-[32px] font-bold text-slate-800 tracking-tight leading-none">{value ?? '—'}</p>
        <p className="text-[12px] text-slate-400 mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function TrendChart({ title, data, color = '#10b981' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="rounded-2xl p-6" style={cardStyle}>
      <p className="text-[13px] font-semibold text-slate-700 mb-5">{title}</p>
      <div className="flex items-end gap-2 h-28">
        {data.map((d, i) => {
          const pct = max ? (d.count / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: pct > 0 ? color : '#cbd5e1' }}>
                {d.count > 0 ? d.count : ''}
              </span>
              <div className="w-full rounded-t-lg transition-all duration-700" style={{
                height: `${Math.max(pct, 4)}%`,
                background: pct > 0 ? `linear-gradient(180deg, ${color}cc, ${color}66)` : '#f1f5f9',
                minHeight: 4,
              }} />
              <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChart({ title, items, total, colorMap }) {
  return (
    <div className="rounded-2xl p-6" style={cardStyle}>
      <p className="text-[13px] font-semibold text-slate-700 mb-5">{title}</p>
      <div className="space-y-3.5">
        {items.sort((a, b) => b.count - a.count).map((item, i) => {
          const pct = total ? Math.round((item.count / total) * 100) : 0;
          const color = colorMap?.[item._id] || COLORS[i % COLORS.length];
          return (
            <div key={item._id} className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 shrink-0 w-28 truncate">{item._id || 'Башка'}</span>
              <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: '#f1f5f9' }}>
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="text-[12px] font-semibold text-slate-700 w-8 text-right tabular-nums">{item.count}</span>
            </div>
          );
        })}
        {!items?.length && <p className="text-[13px] text-slate-400 text-center py-4">Маалымат жок</p>}
      </div>
    </div>
  );
}

function RecentItem({ item, onClick }) {
  const initials = item.fullName?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const colors = [['#3b82f6','#6366f1'],['#10b981','#059669'],['#f59e0b','#f97316'],['#a855f7','#7c3aed'],['#f43f5e','#db2777'],['#06b6d4','#0284c7']];
  const [from, to] = colors[(item.fullName?.charCodeAt(0) || 0) % colors.length];

  return (
    <div
      className="flex items-center gap-3 py-3 px-1 rounded-xl cursor-pointer transition-all"
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{item.fullName}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.inn} · {item.status || '—'}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#10b981' }}>
          {item.needType || '—'}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = user?.isSuperadmin ? '/dashboard/global' : '/dashboard/stats';
    Promise.all([
      api.get(endpoint),
      api.get('/beneficiaries?limit=5&page=1'),
    ])
      .then(([s, r]) => {
        setStats(s.data.data);
        setRecent(r.data.data || []);
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner />;

  const isSA = user?.isSuperadmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">
          {isSA ? 'Глобал статистика' : user?.foundation?.name || 'Башкы бет'}
        </h1>
        <p className="text-[13px] text-slate-400 mt-1">Тутумдун жалпы абалы жана статистикасы</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Жалпы муктаждар" value={stats?.totalBeneficiaries} icon={Users} from="#3b82f6" to="#6366f1" sub={stats?.thisMonthBeneficiaries} />
        <StatCard label="Жалпы жардамдар" value={stats?.totalAid} icon={Heart} from="#10b981" to="#059669" sub={isSA ? undefined : stats?.thisMonthAid} />
        {isSA ? (
          <>
            <StatCard label="Бул ай катталган" value={stats?.thisMonthBeneficiaries} icon={TrendingUp} from="#a855f7" to="#7c3aed" />
            <StatCard label="Активдүү фонддор" value={stats?.totalFoundations} icon={Building2} from="#f59e0b" to="#f97316" />
          </>
        ) : (
          <>
            <StatCard label="Бул ай жардам" value={stats?.thisMonthAid} icon={TrendingUp} from="#a855f7" to="#7c3aed" />
            <StatCard label="Бул ай катталган" value={stats?.thisMonthBeneficiaries} icon={Calendar} from="#f59e0b" to="#f97316" />
          </>
        )}
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Charts column */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-5">
          {stats?.monthlyBeneficiaries?.length > 0 && (
            <TrendChart title="Катталгандар (6 ай)" data={stats.monthlyBeneficiaries} color="#3b82f6" />
          )}
          {!isSA && stats?.monthlyAid?.length > 0 && (
            <TrendChart title="Берилген жардам (6 ай)" data={stats.monthlyAid} color="#10b981" />
          )}
          {stats?.byNeedType?.length > 0 && (
            <BarChart title="Муктаждык боюнча" items={stats.byNeedType} total={stats.totalBeneficiaries} />
          )}
          {!isSA && stats?.byStatus?.length > 0 && (
            <BarChart title="Абал боюнча" items={stats.byStatus} total={stats.totalBeneficiaries} colorMap={STATUS_LABELS} />
          )}
          {stats?.byFoundation?.length > 0 && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center gap-2 mb-5">
                <Banknote size={14} style={{ color: '#10b981' }} />
                <p className="text-[13px] font-semibold text-slate-700">Фонддор боюнча</p>
              </div>
              <div className="space-y-3">
                {stats.byFoundation.map((f, i) => {
                  const maxAmt = stats.byFoundation[0]?.totalAmount || 1;
                  const pct = maxAmt ? Math.round((f.totalAmount / maxAmt) * 100) : 0;
                  return (
                    <div key={f.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] text-slate-600 truncate max-w-40">{f.name}</span>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-[11px] text-slate-400">{f.count} жардам</span>
                          <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                            {f.totalAmount > 0 ? `${f.totalAmount.toLocaleString('ru-RU')} сом` : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ background: '#f1f5f9' }}>
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isSA && stats?.byRegion?.length > 0 && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={14} style={{ color: '#10b981' }} />
                <p className="text-[13px] font-semibold text-slate-700">Аймак боюнча</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.byRegion.slice(0, 8).map((r, i) => (
                  <div key={r._id || 'unknown'} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: '#f8fafc' }}>
                    <span className="text-[12px] text-slate-600 truncate">{r._id || 'Белгисиз'}</span>
                    <span className="text-[13px] font-bold ml-2" style={{ color: COLORS[i % COLORS.length] }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent beneficiaries */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-slate-700">Акыркы муктаждар</p>
            <button
              onClick={() => navigate('/lists')}
              className="flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
              style={{ color: '#10b981' }}
              onMouseEnter={e => e.currentTarget.style.color = '#059669'}
              onMouseLeave={e => e.currentTarget.style.color = '#10b981'}
            >
              Баары <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length > 0
              ? recent.map(b => (
                  <RecentItem key={b._id} item={b} onClick={() => navigate(`/beneficiaries/${b._id}`)} />
                ))
              : <p className="text-[13px] text-slate-400 text-center py-8">Маалымат жок</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
