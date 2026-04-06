import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X } from 'lucide-react';

// Vite uchun Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange }) {
  const hasPin = lat != null && lng != null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Картадан жайгашкан орду
        </label>
        {hasPin && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 transition-colors"
          >
            <X size={11} /> Өчүрүү
          </button>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ height: 280, border: '1px solid #e2e8f0' }}
      >
        <MapContainer
          center={[41.5, 74.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <ClickHandler onChange={onChange} />
          {hasPin && (
            <Marker
              position={[lat, lng]}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const { lat: la, lng: ln } = e.target.getLatLng();
                  onChange(la, ln);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {hasPin ? (
        <p className="flex items-center gap-1.5 text-[12px]" style={{ color: '#10b981' }}>
          <MapPin size={11} />
          {lat.toFixed(5)}, {lng.toFixed(5)}
          <span className="text-slate-400 ml-1">— сүйрөп жылдырсаңыз болот</span>
        </p>
      ) : (
        <p className="text-[12px] text-slate-400">
          Картаны басып пин коюңуз (милдеттүү эмес)
        </p>
      )}
    </div>
  );
}
