import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
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

// ─── Badges ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diffDays = Math.ceil((d - new Date()) / 86400000);
  const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  let bg = '#f0fdf4', color = '#16a34a';
  if (diffDays < 0)   { bg = '#fef2f2'; color = '#dc2626'; }
  else if (diffDays <= 3) { bg = '#fffbeb'; color = '#d97706'; }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Ionicons name="calendar-outline" size={11} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{label}{diffDays < 0 ? ' (өттү)' : ''}</Text>
    </View>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.borderLight, justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
        <Ionicons name={icon} size={14} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 13, color: C.text, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function NoticeDetailScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { user }   = useAuth();
  const { id }     = route.params;

  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [newStatus,      setNewStatus]      = useState('');
  const [statusComment,  setStatusComment]  = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [commentText,    setCommentText]    = useState('');
  const [addingComment,  setAddingComment]  = useState(false);
  const [editing,        setEditing]        = useState(false);
  const [editForm,       setEditForm]       = useState({});
  const [saving,         setSaving]         = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/notices/${id}`);
      setData(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Жүктөлгөн жок' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleStatusChange = async () => {
    if (!newStatus) {
      Toast.show({ type: 'error', text1: 'Статус тандаңыз' });
      return;
    }
    setChangingStatus(true);
    try {
      const res = await api.patch(`/notices/${id}/status`, { status: newStatus, comment: statusComment });
      setData(res.data.data);
      setNewStatus('');
      setStatusComment('');
      Toast.show({ type: 'success', text1: 'Статус өзгөртүлдү' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/notices/${id}/comment`, { comment: commentText });
      setData(res.data.data);
      setCommentText('');
      Toast.show({ type: 'success', text1: 'Комментарий кошулду' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setAddingComment(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      title:       data.title,
      description: data.description || '',
      address:     data.address     || '',
      phone:       data.phone       || '',
      region:      data.region      || '',
      district:    data.district    || '',
      priority:    data.priority,
      deadline:    data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
    });
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim()) {
      Toast.show({ type: 'error', text1: 'Аталыш киргизиңиз' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/notices/${id}`, editForm);
      setData(d => ({ ...d, ...res.data.data }));
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Өзгөртүлдү' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Өчүрүү', 'Маалыматты өчүрөсүзбү?', [
      { text: 'Жок', style: 'cancel' },
      {
        text: 'Өчүрүү', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/notices/${id}`);
            Toast.show({ type: 'success', text1: 'Өчүрүлдү' });
            navigation.goBack();
          } catch (err) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
          }
        },
      },
    ]);
  };

  if (loading) return <Spinner />;
  if (!data) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <Ionicons name="megaphone-outline" size={40} color={C.textLight} style={{ opacity: 0.4, marginBottom: 8 }} />
      <Text style={{ color: C.textLight, fontSize: 14 }}>Маалымат табылган жок</Text>
    </View>
  );

  const isOwner = user?.isSuperadmin || data.createdByFoundation?._id === user?.foundation?._id;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── Header card ── */}
        <View style={s.card}>
          {editing ? (
            /* Edit form */
            <View style={{ gap: 0 }}>
              <Text style={s.sectionTitle}>Өзгөртүү</Text>

              <Text style={s.fieldLabel}>АТАЛЫШЫ *</Text>
              <TextInput style={s.input} value={editForm.title} onChangeText={v => setEditForm(p => ({ ...p, title: v }))} placeholderTextColor={C.textLight} />

              <Text style={s.fieldLabel}>СҮРӨТТӨМӨ</Text>
              <TextInput style={[s.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} multiline value={editForm.description} onChangeText={v => setEditForm(p => ({ ...p, description: v }))} placeholderTextColor={C.textLight} />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>ДАРЕК</Text>
                  <TextInput style={s.input} value={editForm.address} onChangeText={v => setEditForm(p => ({ ...p, address: v }))} placeholderTextColor={C.textLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>ТЕЛЕФОН</Text>
                  <TextInput style={s.input} keyboardType="phone-pad" value={editForm.phone} onChangeText={v => setEditForm(p => ({ ...p, phone: v }))} placeholderTextColor={C.textLight} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>АЙМАК</Text>
                  <TextInput style={s.input} value={editForm.region} onChangeText={v => setEditForm(p => ({ ...p, region: v }))} placeholderTextColor={C.textLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>РАЙОН</Text>
                  <TextInput style={s.input} value={editForm.district} onChangeText={v => setEditForm(p => ({ ...p, district: v }))} placeholderTextColor={C.textLight} />
                </View>
              </View>

              <Text style={s.fieldLabel}>МӨӨНӨТ (YYYY-MM-DD)</Text>
              <TextInput style={s.input} value={editForm.deadline} onChangeText={v => setEditForm(p => ({ ...p, deadline: v }))} placeholder="2025-12-31" placeholderTextColor={C.textLight} />

              <Text style={s.fieldLabel}>ПРИОРИТЕТ</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.priorityBtn, editForm.priority === key ? { backgroundColor: cfg.color } : { backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '40' }]}
                    onPress={() => setEditForm(p => ({ ...p, priority: key }))}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: editForm.priority === key ? '#fff' : cfg.color }}>{cfg.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.borderLight }]} onPress={() => setEditing(false)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.textMuted }}>Жокко чыгаруу</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.primary, flex: 1 }]} onPress={handleUpdate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Сактоо</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* View mode */
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.titleText}>{data.title}</Text>
                  {data.deadline && (
                    <View style={{ marginTop: 6 }}>
                      <DeadlineBadge deadline={data.deadline} />
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <PriorityBadge priority={data.priority} />
                  <StatusBadge status={data.status} />
                </View>
              </View>

              {!!data.description && (
                <Text style={s.descText}>{data.description}</Text>
              )}

              <View style={{ marginTop: 8, gap: 0 }}>
                <InfoRow icon="location-outline"  label="ДАРЕК"  value={data.address} />
                <InfoRow icon="map-outline"        label="АЙМАК"  value={[data.region, data.district].filter(Boolean).join(', ')} />
                <InfoRow icon="call-outline"       label="ТЕЛЕФОН" value={data.phone} />
              </View>

              {data.beneficiary && (
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: C.blueBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bfdbfe' }}>
                  <Ionicons name="person-outline" size={15} color={C.blue} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.blue }}>{data.beneficiary.fullName}</Text>
                  {data.beneficiary.inn && (
                    <Text style={{ fontSize: 11, color: C.textLight }}>{data.beneficiary.inn}</Text>
                  )}
                </View>
              )}

              <View style={[s.divider, { marginTop: 12 }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: C.textLight }}>
                  {data.createdByFoundation?.name || '—'} · {new Date(data.createdAt).toLocaleDateString('ru-RU')}
                </Text>
                {isOwner && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: C.blueBg }}
                    onPress={openEdit}
                  >
                    <Ionicons name="pencil-outline" size={13} color={C.blue} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue }}>Өзгөртүү</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* ── Status change ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Статусту өзгөртүү</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 12 }}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[s.statusBtn, newStatus === key ? { backgroundColor: cfg.color } : { backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '40' }]}
                onPress={() => setNewStatus(key)}
              >
                <Ionicons name={cfg.icon} size={12} color={newStatus === key ? '#fff' : cfg.color} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: newStatus === key ? '#fff' : cfg.color, marginLeft: 3 }}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Изох (милдеттүү эмес)..."
              placeholderTextColor={C.textLight}
              value={statusComment}
              onChangeText={setStatusComment}
            />
            <TouchableOpacity
              style={[s.sendBtn, !newStatus && { opacity: 0.4 }]}
              onPress={handleStatusChange}
              disabled={!newStatus || changingStatus}
            >
              {changingStatus
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Add comment ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Комментарий кошуу</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Маалымат же суроо..."
              placeholderTextColor={C.textLight}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: '#6366f1' }, !commentText.trim() && { opacity: 0.4 }]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || addingComment}
            >
              {addingComment
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── History ── */}
        {data.history?.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Тарых</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {[...data.history].reverse().map((h, i) => {
                const cfg = STATUS_CFG[h.status] || STATUS_CFG.open;
                const prevStatus = data.history[data.history.length - 1 - i]?.status;
                const nextStatus = data.history[data.history.length - i]?.status;
                const isComment = i > 0 && prevStatus === nextStatus;
                const dotColor = isComment ? '#6366f1' : cfg.color;
                return (
                  <View key={i} style={s.historyItem}>
                    <View style={[s.historyDot, { backgroundColor: dotColor + '20', borderColor: dotColor + '40' }]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: dotColor }}>
                          {isComment ? 'Комментарий' : cfg.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.textLight }}>
                          · {h.changedByFoundation?.name || h.changedBy?.name || 'Белгисиз'}
                        </Text>
                      </View>
                      {!!h.comment && (
                        <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{h.comment}</Text>
                      )}
                      <Text style={{ fontSize: 10, color: C.textLight, marginTop: 2 }}>
                        {new Date(h.changedAt).toLocaleString('ru-RU')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Delete ── */}
        {isOwner && (
          <View style={{ paddingHorizontal: 14, marginTop: 4 }}>
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={15} color={C.red} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.red }}>Маалыматты өчүрүү</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  card:         { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginHorizontal: 14, marginTop: 14, borderWidth: 1, borderColor: C.border },

  titleText:    { fontSize: 17, fontWeight: '800', color: C.text, lineHeight: 23 },
  descText:     { fontSize: 13, color: C.textMuted, lineHeight: 20, marginTop: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider:      { height: 1, backgroundColor: C.borderLight, marginVertical: 8 },

  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.6, marginBottom: 5, marginTop: 10 },
  input:        { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.text, borderWidth: 1, borderColor: C.border },

  priorityBtn:  { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  statusBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10 },

  actionBtn:    { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  sendBtn:      { width: 46, height: 46, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  historyItem:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  historyDot:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 1 },

  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.red + '40', backgroundColor: C.redBg },
});
