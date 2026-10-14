// Муктаждын текшерүү абалы. Эски жазууларда талаа жок — «Текшерилбеген» деп эсептейбиз.
export const DEFAULT_VERIFICATION = 'Текшерилбеген';

export const VERIFICATION_META = {
  'Текшерилбеген': { icon: 'help-circle',        bg: '#f1f5f9', color: '#64748b' },
  'Текшерүүдө':    { icon: 'time',               bg: '#eff6ff', color: '#2563eb' },
  'Текшерилген':   { icon: 'shield-checkmark',   bg: '#ecfdf5', color: '#059669' },
  'Шектүү':        { icon: 'alert-circle',       bg: '#fffbeb', color: '#d97706' },
  'Аферист':       { icon: 'close-circle',       bg: '#fef2f2', color: '#dc2626' },
};

export const VERIFICATION_STATUSES = Object.keys(VERIFICATION_META);

export const getVerification = (v) => {
  const value = v || DEFAULT_VERIFICATION;
  return { value, ...(VERIFICATION_META[value] || VERIFICATION_META[DEFAULT_VERIFICATION]) };
};
