import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Phone, MapPin, Calendar, Users, User, Heart, Plus, ChevronDown, Pencil, Trash2, History, FilePlus, FileEdit, FileX } from 'lucide-react';
import api from '../../config/axios';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import AidModal from './AidModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const avatarColors = [
  ['#3b82f6', '#6366f1'], ['#a855f7', '#7c3aed'], ['#f43f5e', '#db2777'],
  ['#f59e0b', '#f97316'], ['#10b981', '#059669'], ['#06b6d4', '#0284c7'],
];
function getAvatarColors(name = '') {
  let s = 0; for (const c of name) s += c.charCodeAt(0);
  return avatarColors[s % avatarColors.length];
}
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

const needColors = {
  'Азык-түүлүк': 'green', 'Дары-дармек': 'blue', 'Акча': 'yellow',
  'Кийим': 'purple', 'Мэбел': 'gray', 'Башка': 'gray',
};

function AidAccordion({ rec, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: !isLast ? '1px solid #f8fafc' : 'none' }}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 py-3.5 text-left cursor-pointer transition-all rounded-xl px-1"
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
          <Badge color={needColors[rec.aidType] || 'gray'}>{rec.aidType}</Badge>
          {rec.amount > 0 && (
            <span className="text-[13px] font-semibold" style={{ color: '#10b981' }}>
              {rec.amount.toLocaleString()} сом
            </span>
          )}
          <span className="text-[12px] text-slate-400 truncate">{rec.description}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12px] text-slate-400">{new Date(rec.givenAt).toLocaleDateString('ru-RU')}</span>
          <ChevronDown
            size={15}
            className="transition-transform duration-200"
            style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Body — expanded */}
      {open && (
        <div className="px-1 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 rounded-xl p-4" style={{ background: '#f8fafc' }}>
            {rec.foundation?.name && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Фонд</p>
                <p className="text-[13px] font-semibold text-slate-700">{rec.foundation.name}</p>
              </div>
            )}
            {rec.givenBy?.name && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Берген</p>
                <p className="text-[13px] text-slate-700">{rec.givenBy.name}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Күнү</p>
              <p className="text-[13px] text-slate-700">{new Date(rec.givenAt).toLocaleDateString('ru-RU')}</p>
            </div>
            {rec.amount > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Сумма</p>
                <p className="text-[13px] font-semibold" style={{ color: '#10b981' }}>{rec.amount.toLocaleString()} сом</p>
              </div>
            )}
          </div>
          {rec.description && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Сүрөттөмө</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{rec.description}</p>
            </div>
          )}
          {rec.notes && (
            <p className="text-[12px] text-slate-400 italic border-l-2 border-slate-100 pl-3">{rec.notes}</p>
          )}
          {rec.photo && (
            <a href={rec.photo} target="_blank" rel="noreferrer" className="block">
              <img
                src={rec.photo}
                alt="жардам сүрөтү"
                className="rounded-xl object-cover w-full transition-opacity hover:opacity-90 cursor-zoom-in"
                style={{ maxHeight: 260 }}
              />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const FIELD_LABELS = {
  status: 'Абалы',
  needType: 'Муктаждыгы',
  fullName: 'Аты-жөнү',
  address: 'Дарек',
  phone: 'Телефон',
  birthDate: 'Туулган жылы',
  childrenCount: 'Балдар саны',
  guardianType: 'Кимдин карамагында',
  region: 'Облус',
  district: 'Район',
  village: 'Айыл',
  comments: 'Комментарий',
  photo: 'Сүрөт',
};

const ACTION_META = {
  create: { icon: FilePlus, color: '#10b981', bg: '#f0fdf4', label: 'Катталды' },
  update: { icon: FileEdit, color: '#3b82f6', bg: '#eff6ff', label: 'Жаңыланды' },
  delete: { icon: FileX, color: '#ef4444', bg: '#fef2f2', label: 'Өчүрүлдү' },
};

function HistoryTimeline({ history }) {
  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
        <History size={13} />
        Өзгөртүүлөр тарыхы
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#f1f5f9', color: '#64748b' }}>
          {history.length}
        </span>
      </h2>

      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-3.75 top-0 bottom-0 w-px" style={{ background: '#f1f5f9' }} />

        <div className="space-y-4">
          {history.map((log, i) => {
            const meta = ACTION_META[log.action] || ACTION_META.update;
            const Icon = meta.icon;
            const date = new Date(log.createdAt);
            const dateStr = date.toLocaleDateString('ru-RU');
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={log._id} className="flex gap-3 relative">
                {/* dot */}
                <div
                  className="w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 z-10"
                  style={{ background: meta.bg, border: `1.5px solid ${meta.color}22` }}
                >
                  <Icon size={13} style={{ color: meta.color }} />
                </div>

                {/* content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-semibold text-slate-700">{meta.label}</span>
                    {log.user?.name && (
                      <span className="text-[12px] text-slate-400">— {log.user.name}</span>
                    )}
                    {log.foundation?.name && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                      >
                        {log.foundation.name}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-slate-300 shrink-0">{dateStr} {timeStr}</span>
                  </div>

                  {/* field changes */}
                  {log.changes && log.changes.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {log.changes.map((ch, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-[12px]">
                          <span
                            className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', minWidth: 80, textAlign: 'center' }}
                          >
                            {FIELD_LABELS[ch.field] || ch.field}
                          </span>
                          {ch.field === 'photo' ? (
                            <span className="text-slate-400 italic">сүрөт жаңыланды</span>
                          ) : (
                            <span className="text-slate-500 min-w-0 wrap-break-word">
                              {ch.from
                                ? <><span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{ch.from}</span><span className="mx-1 text-slate-300">→</span></>
                                : null
                              }
                              <span style={{ color: '#10b981' }}>{ch.to || '—'}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!log.changes?.length && log.description && (
                    <p className="text-[12px] text-slate-400 mt-0.5">{log.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BeneficiaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [aidRecords, setAidRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aidModal, setAidModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [main, hist] = await Promise.all([
        api.get(`/beneficiaries/${id}`),
        api.get(`/beneficiaries/${id}/history`),
      ]);
      setData(main.data.data);
      setAidRecords(main.data.aidRecords);
      setHistory(hist.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/beneficiaries/${id}`);
      toast.success('Муктаж өчүрүлдү');
      navigate('/lists');
    } catch {
      toast.error('Өчүрүүдө ката кетти');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Spinner />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
      <User size={40} className="mb-3 opacity-30" />
      <p className="text-[13px]">Муктаж табылган жок</p>
    </div>
  );

  const [c1, c2] = getAvatarColors(data.fullName);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate('/lists')}
          className="p-2 rounded-xl cursor-pointer transition-all"
          style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-slate-800 truncate">{data.fullName}</h1>
          <p className="text-[11px] text-slate-400 font-mono">ИНН: {data.inn}</p>
        </div>
        <button
          onClick={() => window.open(`/api/beneficiaries/${id}/pdf`, '_blank')}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
          style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        >
          <Download size={13} />
          PDF
        </button>
        {(user?.isSuperadmin || String(data.registeredBy?._id) === String(user?.foundation?._id)) && (
          <>
            <button
              onClick={() => navigate(`/beneficiaries/${id}/edit`)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Pencil size={13} />
              Өзгөртүү
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
              style={{ background: '#fff', border: '1px solid #fecaca', color: '#ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <Trash2 size={13} />
              Өчүрүү
            </button>
          </>
        )}
        <button
          onClick={() => setAidModal(true)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-all text-white"
          style={{ background: '#10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#059669'}
          onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
        >
          <Plus size={13} strokeWidth={2.5} />
          Жардам жазуу
        </button>
      </div>

      {/* Main profile card */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="flex gap-5 items-start">
          {data.photo ? (
            <img src={data.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 text-white text-2xl font-bold"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
              {getInitials(data.fullName)}
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={needColors[data.needType] || 'gray'}>{data.needType}</Badge>
              <Badge color="gray">{data.status}</Badge>
              {data.guardianType && <Badge color="blue">{data.guardianType}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {data.phone && (
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Phone size={12} className="text-slate-300 shrink-0" />
                  {data.phone}
                </div>
              )}
              {data.birthDate && (
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Calendar size={12} className="text-slate-300 shrink-0" />
                  {new Date(data.birthDate).toLocaleDateString('ru-RU')}
                </div>
              )}
              {data.address && (
                <div className="flex items-center gap-2 text-[13px] text-slate-600 col-span-2">
                  <MapPin size={12} className="text-slate-300 shrink-0" />
                  {data.address}
                </div>
              )}
              {(data.region || data.district) && (
                <div className="flex items-center gap-2 text-[12px] text-slate-400 col-span-2">
                  <MapPin size={11} className="text-slate-200 shrink-0" />
                  {[data.region, data.district, data.village].filter(Boolean).join(' › ')}
                </div>
              )}
            </div>
            {data.childrenCount > 0 && (
              <div className="flex items-center gap-2 text-[13px] text-slate-500">
                <Users size={12} className="text-slate-300 shrink-0" />
                Балдары: {data.childrenCount}
              </div>
            )}
            {data.comments && (
              <p className="text-[12px] text-slate-400 italic border-l-2 border-slate-100 pl-3">{data.comments}</p>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 flex items-center gap-2 text-[12px] text-slate-400" style={{ borderTop: '1px solid #f8fafc' }}>
          <span>Каттаган:</span>
          <span className="text-slate-600 font-medium">{data.registeredBy?.name}</span>
          {data.registeredByUser?.name && (
            <>
              <span className="text-slate-200">•</span>
              <span>{data.registeredByUser.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Spouse */}
      {data.spouse?.fullName && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Үй-бүлөсү</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Байланышы', value: data.spouse.relation },
              { label: 'Аты-жөнү', value: data.spouse.fullName },
              { label: 'ИНН', value: data.spouse.inn, mono: true },
              { label: 'Телефон', value: data.spouse.phone },
              { label: 'Иштейби', node: <Badge color={data.spouse.employed ? 'green' : 'gray'}>{data.spouse.employed ? 'Иштейт' : 'Иштебейт'}</Badge> },
            ].map(({ label, value, node, mono }) => (
              <div key={label}>
                <p className="text-[11px] text-slate-400 mb-1">{label}</p>
                {node || <p className={`text-[13px] text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Children */}
      {data.children?.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Балдары <span className="text-slate-200 normal-case font-medium">({data.children.length})</span>
          </h2>
          <div className="space-y-1">
            {data.children.map((child, i) => (
              <div key={i} className="flex gap-4 text-[13px] py-2.5" style={{ borderBottom: i < data.children.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <span className="text-slate-200 w-5 shrink-0 font-medium">{i + 1}</span>
                <span className="flex-1 text-slate-700 font-medium">{child.fullName || '—'}</span>
                <span className="font-mono text-slate-400 text-[12px]">{child.inn || '—'}</span>
                <span className="text-slate-400 text-[12px] shrink-0">
                  {child.birthDate ? new Date(child.birthDate).toLocaleDateString('ru-RU') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clothing sizes */}
      {(data.clothingSize || data.shoeSize || data.spouse?.clothingSize || data.spouse?.shoeSize || data.children?.some(c => c.clothingSize || c.shoeSize)) && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Кийим өлчөмдөрү</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
            <div className="grid grid-cols-3" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Аты-жөнү</div>
              <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Кийим</div>
              <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-100">Бут кийим</div>
            </div>
            {(data.clothingSize || data.shoeSize) && (
              <div className="grid grid-cols-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                <div className="px-4 py-2.5 text-[13px] font-medium text-slate-700">{data.fullName}</div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{data.clothingSize || '—'}</div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{data.shoeSize || '—'}</div>
              </div>
            )}
            {(data.spouse?.clothingSize || data.spouse?.shoeSize) && (
              <div className="grid grid-cols-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                <div className="px-4 py-2.5 text-[13px] text-slate-600">{data.spouse.fullName}</div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{data.spouse.clothingSize || '—'}</div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{data.spouse.shoeSize || '—'}</div>
              </div>
            )}
            {data.children?.filter(c => c.clothingSize || c.shoeSize).map((child, i) => (
              <div key={i} className="grid grid-cols-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                <div className="px-4 py-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-300 font-medium">{i + 1}</span>
                  <span className="text-[13px] text-slate-600">{child.fullName || `${i + 1}-бала`}</span>
                </div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{child.clothingSize || '—'}</div>
                <div className="px-4 py-2.5 text-[13px] text-slate-600 border-l border-slate-50">{child.shoeSize || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aid records */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Жардам тарыхы
            {aidRecords.length > 0 && (
              <span
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              >
                {aidRecords.length}
              </span>
            )}
          </h2>
        </div>
        {aidRecords.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-slate-200">
            <Heart size={22} />
            <p className="text-[13px] text-slate-300">Жардам жазуулары жок</p>
          </div>
        ) : (
          <div>
            {aidRecords.map((rec, i) => (
              <AidAccordion key={rec._id} rec={rec} isLast={i === aidRecords.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* History timeline */}
      {history.length > 0 && (
        <HistoryTimeline history={history} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                <Trash2 size={18} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-800">Өчүрүүнү ырастайсызбы?</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{data.fullName}</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-500">
              Бул муктаж жана анын жардам тарыхы толугу менен өчүрүлөт. Бул аракетти кайтаруу мүмкүн эмес.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
                style={{ background: '#f1f5f9', color: '#475569' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                Жокко чыгаруу
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all text-white"
                style={{ background: deleting ? '#fca5a5' : '#ef4444' }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = '#ef4444'; }}
              >
                {deleting ? 'Өчүрүлүүдө...' : 'Өчүрүү'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aidModal && (
        <AidModal
          beneficiaryId={id}
          onClose={() => setAidModal(false)}
          onSaved={() => { setAidModal(false); load(); }}
        />
      )}
    </div>
  );
}
