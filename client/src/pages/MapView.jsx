import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../config/axios';
import Spinner from '../components/ui/Spinner';
import { MapPin } from 'lucide-react';

// Leaflet default icon fix (Vite uchun)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const needColors = {
  'Азык-түүлүк': '#f59e0b',
  'Дары-дармек': '#3b82f6',
  'Акча': '#10b981',
  'Кийим': '#8b5cf6',
  'Мэбел': '#f97316',
  'Башка': '#94a3b8',
};

const cardStyle = {
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.04)',
};

export default function MapView() {
  const [data, setData] = useState({ pins: [], regions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/map')
      .then(r => {
        const d = r.data.data;
        // eski format: array | жаңы формат: { pins, regions }
        if (Array.isArray(d)) {
          setData({ pins: [], regions: d });
        } else {
          setData({ pins: d?.pins || [], regions: d?.regions || [] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = data.regions.reduce((s, i) => s + i.count, 0);
  const byRegion = {};
  data.regions.forEach(({ _id, count }) => {
    const r = _id?.region || 'Белгисиз';
    byRegion[r] = (byRegion[r] || 0) + count;
  });
  const regionList = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Картада муктаждар</h1>
          <p className="text-[13px] text-slate-400 mt-1">Жалпы {total} — картада {data.pins.length} пин белгиленген</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(needColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ ...cardStyle, height: 520 }}>
          <MapContainer
            center={[41.5, 74.5]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>'
            />
            {data.pins.map(pin => (
              <CircleMarker
                key={pin._id}
                center={[pin.lat, pin.lng]}
                radius={9}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: needColors[pin.needType] || '#94a3b8',
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#1e293b' }}>
                      {pin.fullName}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>
                      {pin.region}{pin.district ? ` / ${pin.district}` : ''}{pin.village ? ` / ${pin.village}` : ''}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      background: needColors[pin.needType] || '#94a3b8',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 20,
                      marginTop: 4,
                    }}>
                      {pin.needType || 'Башка'}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Region stats */}
        <div className="rounded-2xl p-5" style={{ ...cardStyle, height: 520, overflowY: 'auto' }}>
          <p className="text-[13px] font-semibold text-slate-700 mb-4">Облустар боюнча</p>

          {data.pins.length === 0 && (
            <div
              className="rounded-xl p-4 mb-4 flex items-start gap-2.5"
              style={{ background: '#fef9c3', border: '1px solid #fde68a' }}
            >
              <MapPin size={14} style={{ color: '#ca8a04', marginTop: 1, shrink: 0 }} />
              <p className="text-[12px]" style={{ color: '#92400e' }}>
                Картада пин жок. Муктаж кошууда "Картадагы жайгашкан орду" бөлүмүнөн белгилеңиз.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {regionList.map(([region, count]) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              const pinnedInRegion = data.pins.filter(p => p.region === region).length;
              return (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-slate-600 truncate">{region || 'Белгисиз'}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {pinnedInRegion > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px]" style={{ color: '#10b981' }}>
                          <MapPin size={9} />{pinnedInRegion}
                        </span>
                      )}
                      <span className="text-[12px] font-bold text-slate-800 tabular-nums">{count}</span>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                    />
                  </div>
                </div>
              );
            })}
            {regionList.length === 0 && (
              <p className="text-[13px] text-slate-400 text-center py-8">Маалымат жок</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
