import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/axios';
import { CATEGORY_COLORS } from '../utils/categories';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch {
      // жүктөлбөсө тизмелер бош калат, барак иштей берет
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => {
    const byKey = new Map(categories.map((c) => [`${c.group}:${c.name}`, c]));

    // Активдүү категориялардын аттары (ирети боюнча).
    // keep — азыркы тандалган маанилер: архивделген болсо да тизмеде калат.
    const list = (group, keep = []) => {
      const names = categories.filter((c) => c.group === group && c.isActive).map((c) => c.name);
      const extra = [].concat(keep).filter((v) => v && !names.includes(v));
      return [...names, ...extra];
    };

    const colorOf = (group, name) => byKey.get(`${group}:${name}`)?.color || 'gray';
    const hexOf = (group, name) => CATEGORY_COLORS[colorOf(group, name)] || CATEGORY_COLORS.gray;

    return { categories, loading, reload, list, colorOf, hexOf };
  }, [categories, loading, reload]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export const useCategories = () => useContext(CategoriesContext);
