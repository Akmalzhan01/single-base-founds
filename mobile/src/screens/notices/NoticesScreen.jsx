import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../config/colors';

// ─── Configs ──────────────────────────────────────────────────
const STATUS_CFG = {
  open:        { label: 'Ачык',       color: '#ef4444', bg: '#fef2f2', icon: 'alert-circle-outline' },
  in_progress: { label: 'Иш үстүндө', color: '#f59e0b', bg: '#fffbeb', icon: 'time-outline' },
  resolved:    { label: 'Чечилди',    color: '#10b981', bg: '#f0fdf4', icon: 'checkmark-circle-outline' },
};

const PRIORITY_CFG = {
  low:    { label: 'Төмөн',  color: '#64748b', bg: '#f8fafc' },
  medium: { label: 'Орто',   color: '#f59e0b', bg: '#fffbeb' },
  high:   { label: 'Жогору', color: '#ef4444', bg: '#fef2f2' },
};

const EMPTY_FORM = {
  title: '', description: '', address: '', region: '',
  district: '', phone: '', priority: 'medium', deadline: '',
};

// ─── Helpers ──────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Азыр';
  if (min < 60) return `${min} мин мурун`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} саат мурун`;
  return `${Math.floor(h / 24)} күн мурун`;
}

// ─── StatusBadge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

// ─── PriorityBadge ────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

// ─── DeadlineBadge ────────────────────────────────────────────
function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diffDays = Math.ceil((d - new Date()) / 86400000);
  const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  let bg = '#f0fdf4', color = '#16a34a';
  if (diffDays < 0)  { bg = '#fef2f2'; color = '#dc2626'; }
  else if (diffDays <= 3) { bg = '#fffbeb'; color = '#d97706'; }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Ionicons name="calendar-outline" size={9} color={color} />
      <Text style={{ fontSize: 10, fontWeight: '600', color }}>{label}{diffDays < 0 ? ' (өттү)' : ''}</Text>
    </View>
  );
}

// ─── Create Modal ─────────────────────────────────────────────
function CreateModal({ visible, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (field) => (val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: 'error', text1: 'Аталыш киргизиңиз' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/notices', form);
      Toast.show({ type: 'success', text1: 'Маалымат жарыяланды' });
      onCreated(res.data.data);
      setForm(EMPTY_FORM);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Жаңы маалымат</Text>
              <TouchableOpacity onPress={onClose} style={s.modalClose}>
                <Ionicons name="close" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={s.fieldLabel}>АТАЛЫШЫ *</Text>
              <TextInput
                style={s.input}
                placeholder="Кыскача маалымат..."
                placeholderTextColor={C.textLight}
                value={form.title}
                onChangeText={set('title')}
              />

              <Text style={s.fieldLabel}>СҮРӨТТӨМӨ</Text>
              <TextInput
                style={[s.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Кеңири маалымат..."
                placeholderTextColor={C.textLight}
                multiline
                value={form.description}
                onChangeText={set('description')}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>ДАРЕК</Text>
                  <TextInput style={s.input} placeholder="Кочо, үй..." placeholderTextColor={C.textLight} value={form.address} onChangeText={set('address')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>ТЕЛЕФОН</Text>
                  <TextInput style={s.input} placeholder="+996..." placeholderTextColor={C.textLight} keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>АЙМАК</Text>
                  <TextInput style={s.input} placeholder="Облус" placeholderTextColor={C.textLight} value={form.region} onChangeText={set('region')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>РАЙОН</Text>
                  <TextInput style={s.input} placeholder="Район" placeholderTextColor={C.textLight} value={form.district} onChangeText={set('district')} />
                </View>
              </View>

              <Text style={s.fieldLabel}>МӨӨНӨТ (YYYY-MM-DD)</Text>
              <TextInput
                style={s.input}
                placeholder="2025-12-31"
                placeholderTextColor={C.textLight}
                value={form.deadline}
                onChangeText={set('deadline')}
              />

              <Text style={s.fieldLabel}>ПРИОРИТЕТ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      s.priorityBtn,
                      form.priority === key
                        ? { backgroundColor: cfg.color }
                        : { backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '40' },
                    ]}
                    onPress={() => setForm(p => ({ ...p, priority: key }))}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: form.priority === key ? '#fff' : cfg.color }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={onClose}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.textMuted }}>Жокко чыгаруу</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 1 }]} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Жарыялоо</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function NoticesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [notices,       setNotices]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterPriority,setFilterPriority]= useState('');
  const [createModal,   setCreateModal]   = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async (q = search, fs = filterStatus, fp = filterPriority) => {
    try {
      const params = new URLSearchParams();
      if (fs) params.set('status', fs);
      if (fp) params.set('priority', fp);
      if (q)  params.set('search', q);
      const res = await api.get(`/notices?${params}`);
      setNotices(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      Toast.show({ type: 'error', text1: 'Жүктөлгөн жок' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterStatus, filterPriority]);

  // filter changes → immediate reload
  useEffect(() => {
    setLoading(true);
    load(search, filterStatus, filterPriority);
  }, [filterStatus, filterPriority]); // eslint-disable-line

  // search debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(search, filterStatus, filterPriority), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]); // eslint-disable-line

  // Reload when screen regains focus (e.g. after navigating back from detail)
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useFocusEffect(useCallback(() => {
    loadRef.current(search, filterStatus, filterPriority);
  }, [])); // eslint-disable-line

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleCreated = (notice) => {
    setNotices(p => [notice, ...p]);
    setTotal(t => t + 1);
    setCreateModal(false);
  };

  return (
    <View style={s.screen}>
      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={C.textLight} style={{ marginRight: 6 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Издөө..."
          placeholderTextColor={C.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 6, paddingHorizontal: 14 }}>
        {[['', 'Баары'], ['open', 'Ачык'], ['in_progress', 'Иш үстүндө'], ['resolved', 'Чечилди']].map(([val, lbl]) => (
          <TouchableOpacity
            key={val}
            style={[s.chip, filterStatus === val && s.chipActive]}
            onPress={() => setFilterStatus(val)}
          >
            <Text style={[s.chipText, filterStatus === val && s.chipTextActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 2 }} />
        {[['', 'Бардык'], ['high', 'Жогору'], ['medium', 'Орто'], ['low', 'Төмөн']].map(([val, lbl]) => (
          <TouchableOpacity
            key={val}
            style={[s.chip, filterPriority === val && s.chipActive]}
            onPress={() => setFilterPriority(val)}
          >
            <Text style={[s.chipText, filterPriority === val && s.chipTextActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {notices.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
              <Ionicons name="megaphone-outline" size={40} color={C.textLight} style={{ opacity: 0.4 }} />
              <Text style={{ fontSize: 14, color: C.textLight }}>Маалымат жок</Text>
            </View>
          ) : (
            notices.map(n => (
              <TouchableOpacity
                key={n._id}
                style={s.card}
                activeOpacity={0.78}
                onPress={() => navigation.navigate('NoticeDetail', { id: n._id })}
              >
                {/* Priority color bar */}
                <View style={{ width: 3, borderRadius: 3, backgroundColor: PRIORITY_CFG[n.priority]?.color || '#64748b', alignSelf: 'stretch', marginRight: 12 }} />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>{n.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      <DeadlineBadge deadline={n.deadline} />
                      <StatusBadge status={n.status} />
                    </View>
                  </View>

                  {!!n.description && (
                    <Text style={s.cardDesc} numberOfLines={2}>{n.description}</Text>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {!!n.address && <Text style={s.metaText}>📍 {n.address}</Text>}
                    {!!n.region  && <Text style={s.metaText}>🗺 {n.region}{n.district ? `, ${n.district}` : ''}</Text>}
                    {!!n.phone   && <Text style={[s.metaText, { color: C.primary }]}>📞 {n.phone}</Text>}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={s.metaBottom}>
                      {n.createdByFoundation?.name || 'Белгисиз'} · {timeAgo(n.createdAt)}
                    </Text>
                    <PriorityBadge priority={n.priority} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setCreateModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <CreateModal visible={createModal} onClose={() => setCreateModal(false)} onCreated={handleCreated} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },

  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, marginBottom: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  searchInput:   { flex: 1, fontSize: 14, color: C.text },

  filterRow:     { flexGrow: 0, marginBottom: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipActive:    { backgroundColor: '#0d0d18' },
  chipText:      { fontSize: 12, fontWeight: '600', color: C.textMuted },
  chipTextActive:{ color: '#fff' },

  card:          { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: C.text, flex: 1, lineHeight: 19 },
  cardDesc:      { fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 17 },
  metaText:      { fontSize: 11, color: C.textMuted },
  metaBottom:    { fontSize: 11, color: C.textLight },

  fab:           { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },

  // Modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalTitle:    { flex: 1, fontSize: 16, fontWeight: '800', color: C.text },
  modalClose:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.borderLight, justifyContent: 'center', alignItems: 'center' },

  fieldLabel:    { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.6, marginBottom: 5, marginTop: 12 },
  input:         { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },

  priorityBtn:   { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },

  btn:           { paddingVertical: 13, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnSecondary:  { backgroundColor: C.borderLight, paddingHorizontal: 16 },
  btnPrimary:    { backgroundColor: C.primary },
});
