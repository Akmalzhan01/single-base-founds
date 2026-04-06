import { AlertTriangle, User, Phone, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const needColors = {
  'Азык-түүлүк': 'green',
  'Дары-дармек': 'blue',
  'Акча': 'yellow',
  'Кийим': 'purple',
  'Мэбел': 'gray',
  'Башка': 'gray',
};

export default function DuplicateAlert({ data, aidRecords, onContinue, onCancel }) {
  const [showAid, setShowAid] = useState(false);

  return (
    <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 mt-0.5 shrink-0" size={22} />
        <div>
          <h3 className="font-semibold text-yellow-800 text-sm">Бул адам системада катталган!</h3>
          <p className="text-xs text-yellow-700 mt-0.5">
            Кошуудан мурун маалыматты текшериңиз
          </p>
        </div>
      </div>

      {/* Beneficiary info */}
      <div className="bg-white rounded-lg border border-yellow-200 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User size={15} className="text-gray-400" />
          <span className="font-medium text-gray-800">{data.fullName}</span>
          <Badge color={needColors[data.needType] || 'gray'}>{data.needType}</Badge>
        </div>
        {data.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} className="text-gray-400" />
            {data.phone}
          </div>
        )}
        {data.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} className="text-gray-400" />
            {data.address}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={13} />
          Катталган: {data.registeredBy?.name} — {new Date(data.createdAt).toLocaleDateString('ru-RU')}
        </div>
      </div>

      {/* Aid records */}
      {aidRecords?.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAid(!showAid)}
            className="flex items-center gap-1 text-xs font-medium text-yellow-700 hover:text-yellow-900"
          >
            {showAid ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Жардам тарыхы ({aidRecords.length})
          </button>
          {showAid && (
            <div className="mt-2 space-y-1.5">
              {aidRecords.map((rec, i) => (
                <div key={i} className="bg-white rounded-lg border border-yellow-100 px-3 py-2 text-xs text-gray-700">
                  <span className="font-medium">{rec.foundation?.name}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  {new Date(rec.givenAt).toLocaleDateString('ru-RU')}
                  <span className="text-gray-400 mx-1">•</span>
                  {rec.aidType}
                  {rec.amount && <span className="text-green-600 ml-1">({rec.amount} сом)</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onCancel} type="button">
          Артка кайтуу
        </Button>
        <Button variant="primary" size="sm" onClick={onContinue} type="button">
          Баары бир кошуу
        </Button>
      </div>
    </div>
  );
}
