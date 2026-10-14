import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../config/colors';
import { getVerification, VERIFICATION_STATUSES, VERIFICATION_META } from '../../utils/verificationStatus';

// Текшерүү абалынын бейджи. editable болсо — басканда абалды тандоочу барак ачылат.
export default function VerificationBadge({ value, editable = false, onChange, style }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const v = getVerification(value);

  const select = async (next) => {
    setOpen(false);
    if (next === v.value) return;
    setSaving(true);
    try { await onChange?.(next); } finally { setSaving(false); }
  };

  const badge = (
    <View style={[s.badge, { backgroundColor: v.bg }, style]}>
      {saving
        ? <ActivityIndicator size="small" color={v.color} style={{ transform: [{ scale: 0.6 }] }} />
        : <Ionicons name={v.icon} size={12} color={v.color} />}
      <Text style={[s.badgeText, { color: v.color }]}>{v.value}</Text>
      {editable && <Ionicons name="chevron-down" size={11} color={v.color} />}
    </View>
  );

  if (!editable) return badge;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} disabled={saving} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.title}>Текшерүү абалы</Text>
            {VERIFICATION_STATUSES.map((st) => {
              const meta = VERIFICATION_META[st];
              const active = st === v.value;
              return (
                <TouchableOpacity
                  key={st}
                  style={[s.option, active && { backgroundColor: meta.bg }]}
                  onPress={() => select(st)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                  <Text style={[s.optionText, { color: meta.color }]}>{st}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={meta.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 32 },
  sheet:      { backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  title:      { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, padding: 8, paddingBottom: 10 },
  option:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12 },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
