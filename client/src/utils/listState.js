// Муктаждар тизмесинин акыркы URL параметрлери (чыпкалар, барак) — sessionStorage ачкычы.
// Профилден «артка» баскычы ушуну колдонуп, колдонуучуну ошол эле баракка кайтарат.
export const LIST_STATE_KEY = 'beneficiaryListSearch';

export const listUrl = () => {
  try {
    return `/lists${sessionStorage.getItem(LIST_STATE_KEY) || ''}`;
  } catch {
    return '/lists';
  }
};
