import { useEffect, useState, useCallback } from 'react';
import { Shield, Filter } from 'lucide-react';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const ACTION_CONFIG = {
  create:        { label: 'Кошуу',           color: '#10b981', bg: '#f0fdf4' },
  update:        { label: 'Өзгөртүү',         color: '#3b82f6', bg: '#eff6ff' },
  delete:        { label: 'Өчүрүү',           color: '#ef4444', bg: '#fef2f2' },
  status_change: { label: 'Статус',           color: '#f59e0b', bg: '#fffbeb' },
  login:         { label: 'Кирүү',            color: '#6366f1', bg: '#eef2ff' },
};

const ENTITY_LABELS = {
  Beneficiary: 'Муктаж',
  Notice:      'Маалымат',
  AidRecord:   'Жардам',
  User:        'Кызматкер',
};

const ACTIONS = ['', 'create', 'update', 'delete', 'status_change', 'login'];
const ENTITIES = ['', 'Beneficiary', 'Notice', 'AidRecord', 'User'];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 30 };
    if (filterAction) params.action = filterAction;
    if (filterEntity) params.entity = filterEntity;
    api.get('/audit', { params })
      .then(r => { setLogs(r.data.data); setTotal(r.data.total); })
      .catch(() => toast.error('Аудит маалыматы жүктөлгөн жок'))
      .finally(() => setLoading(false));
  }, [page, filterAction, filterEntity]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Shield size={20} style={{ color: '#6366f1' }} /> Аудит лог
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Системадагы бардык аракеттер · жалпы {total}</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 flex gap-3 flex-wrap items-center" style={cardStyle}>
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Filter size={14} />
          <span className="text-[12px] font-medium">Чыпка</span>
        </div>
        <div className="w-px h-5 bg-slate-100 shrink-0" />
        <select
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
        >
          {ACTIONS.map(a => (
            <option key={a} value={a}>{a === '' ? 'Бардык аракет' : ACTION_CONFIG[a]?.label || a}</option>
          ))}
        </select>
        <select
          value={filterEntity}
          onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
        >
          {ENTITIES.map(e => (
            <option key={e} value={e}>{e === '' ? 'Бардык объект' : ENTITY_LABELS[e] || e}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      {loading ? <Spinner /> : logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">Маалымат жок</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Аракет', 'Объект', 'Сүрөттөмө', 'Кызматкер', 'Фонд', 'Убакыт'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, color: '#64748b', bg: '#f8fafc' };
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: actionCfg.bg, color: actionCfg.color }}>
                        {actionCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">
                      {ENTITY_LABELS[log.entity] || log.entity || '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-700 max-w-xs truncate">
                      {log.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">
                      {log.user?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">
                      {log.foundation?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {Math.ceil(total / 30) > 1 && (
        <Pagination page={page} pages={Math.ceil(total / 30)} onChange={setPage} />
      )}
    </div>
  );
}
