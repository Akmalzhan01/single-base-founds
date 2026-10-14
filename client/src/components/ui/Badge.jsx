const colors = {
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  red:    'bg-red-50 text-red-600 ring-1 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  gray:   'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  cyan:   'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  pink:   'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
}
