import { ShieldQuestion, Clock, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

// Муктаждын текшерүү абалы. Эски жазууларда талаа жок — «Текшерилбеген» деп эсептейбиз.
export const DEFAULT_VERIFICATION = 'Текшерилбеген';

export const VERIFICATION_META = {
  'Текшерилбеген': { icon: ShieldQuestion, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  'Текшерүүдө':    { icon: Clock,          bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Текшерилген':   { icon: ShieldCheck,    bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  'Шектүү':        { icon: ShieldAlert,    bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Аферист':       { icon: ShieldX,        bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

export const VERIFICATION_STATUSES = Object.keys(VERIFICATION_META);

export const getVerification = (v) => {
  const value = v || DEFAULT_VERIFICATION;
  return { value, ...(VERIFICATION_META[value] || VERIFICATION_META[DEFAULT_VERIFICATION]) };
};
