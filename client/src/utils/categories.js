// Муктаждын категория топтору — суперадмин «Категориялар» барагында башкарат
export const CATEGORY_GROUPS = [
  { key: 'status',         label: 'Абалы',               hint: 'Муктаждын социалдык абалы (бирөө тандалат)' },
  { key: 'needType',       label: 'Муктаждыгы',          hint: 'Бир нечеси тандалат. Жардамдын түрлөрү да ушул тизмеден алынат' },
  { key: 'guardianType',   label: 'Кимдин карамагында',  hint: 'Бирөө тандалат' },
  { key: 'supportSources', label: 'Ким жардам берет',    hint: 'Бир нечеси тандалат' },
];

// Түс ачкычы -> диаграмма/карта үчүн негизги түс. Бейджде ушул эле ачкычтар колдонулат (Badge.jsx).
export const CATEGORY_COLORS = {
  gray:   '#94a3b8',
  green:  '#10b981',
  blue:   '#3b82f6',
  yellow: '#f59e0b',
  purple: '#a855f7',
  red:    '#ef4444',
  orange: '#f97316',
  cyan:   '#06b6d4',
  pink:   '#ec4899',
};
