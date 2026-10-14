import { useEffect, useMemo, useState } from 'react';
import api from '../config/axios';

// Түс ачкычы (сервердеги Category.color) -> бейдж түстөрү
export const CATEGORY_COLORS = {
  gray:   { bg: '#f1f5f9', color: '#64748b' },
  green:  { bg: '#f0fdf4', color: '#16a34a' },
  blue:   { bg: '#eff6ff', color: '#2563eb' },
  yellow: { bg: '#fffbeb', color: '#d97706' },
  purple: { bg: '#faf5ff', color: '#9333ea' },
  red:    { bg: '#fef2f2', color: '#dc2626' },
  orange: { bg: '#fff7ed', color: '#ea580c' },
  cyan:   { bg: '#ecfeff', color: '#0891b2' },
  pink:   { bg: '#fdf2f8', color: '#db2777' },
};

// Бардык экрандар бир кэшти бөлүшөт; ар бир экран ачылганда фондо кайра жүктөлөт,
// ошондуктан суперадмин веб аркылуу өзгөрткөн категориялар бат эле көрүнөт.
let cache = null;
let inflight = null;
const listeners = new Set();

const fetchCategories = () => {
  if (!inflight) {
    inflight = api.get('/categories')
      .then((res) => {
        cache = res.data.data || [];
        listeners.forEach((l) => l(cache));
      })
      .catch(() => {})
      .finally(() => { inflight = null; });
  }
  return inflight;
};

export function useCategories() {
  const [categories, setCategories] = useState(cache || []);

  useEffect(() => {
    listeners.add(setCategories);
    fetchCategories();
    return () => { listeners.delete(setCategories); };
  }, []);

  return useMemo(() => {
    const byKey = new Map(categories.map((c) => [`${c.group}:${c.name}`, c]));

    // Активдүү категориялар; keep — азыркы маанилер, архивде болсо да калат
    const list = (group, keep = []) => {
      const names = categories.filter((c) => c.group === group && c.isActive).map((c) => c.name);
      const extra = [].concat(keep).filter((v) => v && !names.includes(v));
      return [...names, ...extra];
    };

    const colorOf = (group, name) =>
      CATEGORY_COLORS[byKey.get(`${group}:${name}`)?.color] || CATEGORY_COLORS.gray;

    return { categories, list, colorOf, loaded: categories.length > 0 };
  }, [categories]);
}
