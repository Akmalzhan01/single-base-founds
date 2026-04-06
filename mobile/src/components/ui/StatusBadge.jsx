import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS = {
  active:   { label: 'Активдүү',   bg: '#f0fdf4', color: '#16a34a' },
  inactive: { label: 'Активсыз',   bg: '#f8fafc', color: '#64748b' },
  pending:  { label: 'Күтүүдө',    bg: '#fffbeb', color: '#d97706' },
  // needType
  food:     { label: 'Азык-түлүк', bg: '#fff7ed', color: '#ea580c' },
  medical:  { label: 'Медицина',   bg: '#eff6ff', color: '#3b82f6' },
  clothing: { label: 'Кийим',      bg: '#faf5ff', color: '#9333ea' },
  housing:  { label: 'Турак жай',  bg: '#fef2f2', color: '#ef4444' },
  education:{ label: 'Билим',      bg: '#ecfeff', color: '#0891b2' },
  other:    { label: 'Башка',      bg: '#f8fafc', color: '#64748b' },
};

export default function StatusBadge({ value, style }) {
  const cfg = STATUS[value] || { label: value || '—', bg: '#f1f5f9', color: '#64748b' };
  return (
    <View style={[{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }, style]}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}
