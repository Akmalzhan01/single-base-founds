import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ChildrenForm({ children, onChange }) {
  const add = () => onChange([...children, { inn: '', fullName: '', birthDate: '', clothingSize: '', shoeSize: '' }]);
  const remove = (i) => onChange(children.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const updated = [...children];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Балдары тууралуу маалымат</h3>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} /> Кошуу
        </Button>
      </div>

      {children.length === 0 && (
        <p className="text-xs text-gray-400 italic">Балдар кошулган жок</p>
      )}

      {children.map((child, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
          <Input
            label="Паспорттун ИНН сы"
            placeholder="ИНН"
            value={child.inn}
            onChange={(e) => update(i, 'inn', e.target.value)}
          />
          <Input
            label="Ф. И. О"
            placeholder="Аты-жөнү"
            value={child.fullName}
            onChange={(e) => update(i, 'fullName', e.target.value)}
          />
          <Input
            label="Туулган жылы"
            type="date"
            value={child.birthDate}
            onChange={(e) => update(i, 'birthDate', e.target.value)}
          />
          <Input
            label="Кийим өлчөмү"
            placeholder="S / M / 110..."
            value={child.clothingSize || ''}
            onChange={(e) => update(i, 'clothingSize', e.target.value)}
          />
          <Input
            label="Бут кийим өлчөмү"
            placeholder="24, 36..."
            value={child.shoeSize || ''}
            onChange={(e) => update(i, 'shoeSize', e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
