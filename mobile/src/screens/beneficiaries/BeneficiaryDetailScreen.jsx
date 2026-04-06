import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, RefreshControl, Modal,
  TextInput, ActivityIndicator, Image, Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import { C } from '../../config/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Avatar helpers ───────────────────────────────────────────
const AVATAR_COLORS = [
  '#3b82f6', '#a855f7', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4',
];
function getAvatarColor(name = '') {
  let s = 0;
  for (const c of name) s += c.charCodeAt(0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}
function getInitials(name = '') {
  return (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// ─── Type colors ──────────────────────────────────────────────
const TYPE_COLORS = {
  'Азык-түүлүк': { bg: '#f0fdf4', color: '#16a34a' },
  'Дары-дармек': { bg: '#eff6ff', color: '#3b82f6' },
  'Акча':        { bg: '#fffbeb', color: '#d97706' },
  'Кийим':       { bg: '#faf5ff', color: '#9333ea' },
  'Мэбел':       { bg: '#f8fafc', color: '#64748b' },
  'Башка':       { bg: '#f8fafc', color: '#64748b' },
};

function Badge({ label, bg = '#f1f5f9', color = '#64748b' }) {
  if (!label) return null;
  const cfg = TYPE_COLORS[label] || { bg, color };
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{label}</Text>
    </View>
  );
}

// ─── Full-screen image zoom ───────────────────────────────────
function PhotoZoom({ uri, onClose }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
          onPress={onClose}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri }}
          style={{ width: SCREEN_W, height: SCREEN_H * 0.75 }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

// ─── Tappable image ───────────────────────────────────────────
// onPress is provided by the parent; PhotoZoom is rendered at top-level
// to avoid overflow:hidden parent clipping touches on Android.
function ZoomableImage({ uri, style, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ overflow: 'hidden', borderRadius: style?.borderRadius }}
    >
      <Image source={{ uri }} style={[style, { borderRadius: undefined }]} resizeMode="cover" />
      <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 4 }}>
        <Ionicons name="expand-outline" size={13} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// ─── AidAccordion ─────────────────────────────────────────────
function AidAccordion({ item, isLast, onZoom }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: C.borderLight }}>
      <TouchableOpacity style={s.aidHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge label={item.aidType || 'Жардам'} />
          {item.amount > 0 && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>
              {Number(item.amount).toLocaleString()} сом
            </Text>
          )}
          {!!item.description && (
            <Text style={{ fontSize: 12, color: C.textLight, flex: 1 }} numberOfLines={1}>{item.description}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 11, color: C.textLight }}>
            {new Date(item.givenAt || item.createdAt).toLocaleDateString('ru-RU')}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.textLight} />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={s.aidBody}>
          <View style={s.aidGrid}>
            {item.foundation?.name && (
              <View style={s.aidGridItem}>
                <Text style={s.gridLabel}>ФОНД</Text>
                <Text style={s.gridValue}>{item.foundation.name}</Text>
              </View>
            )}
            {item.givenBy?.name && (
              <View style={s.aidGridItem}>
                <Text style={s.gridLabel}>БЕРГЕН</Text>
                <Text style={s.gridValue}>{item.givenBy.name}</Text>
              </View>
            )}
            <View style={s.aidGridItem}>
              <Text style={s.gridLabel}>КҮНҮ</Text>
              <Text style={s.gridValue}>{new Date(item.givenAt || item.createdAt).toLocaleDateString('ru-RU')}</Text>
            </View>
            {item.amount > 0 && (
              <View style={s.aidGridItem}>
                <Text style={s.gridLabel}>СУММА</Text>
                <Text style={[s.gridValue, { color: '#10b981' }]}>{Number(item.amount).toLocaleString()} сом</Text>
              </View>
            )}
          </View>

          {!!item.description && (
            <View style={{ marginTop: 10 }}>
              <Text style={s.gridLabel}>СҮРӨТТӨМӨ</Text>
              <Text style={{ fontSize: 13, color: C.text, marginTop: 3, lineHeight: 20 }}>{item.description}</Text>
            </View>
          )}
          {!!item.notes && (
            <Text style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', marginTop: 8, borderLeftWidth: 2, borderLeftColor: C.border, paddingLeft: 10 }}>
              {item.notes}
            </Text>
          )}
          {!!item.photo && (
            <View style={{ marginTop: 10 }}>
              <ZoomableImage
                uri={item.photo}
                style={{ width: '100%', height: 180, borderRadius: 12 }}
                onPress={() => onZoom?.(item.photo)}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── History timeline (accordion) ────────────────────────────
const ACTION_META = {
  create: { icon: 'document-text-outline', color: '#10b981', bg: '#f0fdf4', label: 'Катталды' },
  update: { icon: 'create-outline',        color: '#3b82f6', bg: '#eff6ff', label: 'Жаңыланды' },
  delete: { icon: 'trash-outline',         color: '#ef4444', bg: '#fef2f2', label: 'Өчүрүлдү' },
};
const FIELD_LABELS = {
  status: 'Абалы', needType: 'Муктаждыгы', fullName: 'Аты-жөнү', address: 'Дарек',
  phone: 'Телефон', birthDate: 'Туулган жылы', childrenCount: 'Балдар саны',
  guardianType: 'Кимдин карамагында', region: 'Облус', district: 'Район',
  village: 'Айыл', comments: 'Комментарий', photo: 'Сүрөт',
};

function HistoryItem({ log, isLast }) {
  const [open, setOpen] = useState(false);
  const meta = ACTION_META[log.action] || ACTION_META.update;
  const date = new Date(log.createdAt);
  const hasChanges = log.changes?.length > 0;
  const isExpandable = hasChanges || !!log.description;

  return (
    <View style={{ marginBottom: isLast ? 0 : 12 }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
        onPress={() => isExpandable && setOpen(o => !o)}
        activeOpacity={isExpandable ? 0.7 : 1}
      >
        {/* dot */}
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: meta.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: meta.color + '33', marginTop: 1 }}>
          <Ionicons name={meta.icon} size={13} color={meta.color} />
        </View>

        {/* header row */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{meta.label}</Text>
            {log.user?.name && <Text style={{ fontSize: 12, color: C.textMuted }}>— {log.user.name}</Text>}
            {log.foundation?.name && (
              <View style={{ backgroundColor: C.borderLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '600' }}>{log.foundation.name}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: C.textLight }}>
              {date.toLocaleDateString('ru-RU')} {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isExpandable && (
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={C.textLight} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* changes body */}
      {open && (
        <View style={{ marginLeft: 38, marginTop: 8, gap: 6 }}>
          {hasChanges ? log.changes.map((ch, ci) => (
            <View key={ci} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ backgroundColor: C.borderLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '600' }}>
                  {FIELD_LABELS[ch.field] || ch.field}
                </Text>
              </View>
              {ch.field === 'photo' ? (
                <Text style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic' }}>сүрөт жаңыланды</Text>
              ) : (
                <Text style={{ fontSize: 12, flex: 1 }}>
                  {ch.from
                    ? <><Text style={{ color: '#ef4444', textDecorationLine: 'line-through' }}>{ch.from}</Text><Text style={{ color: C.textLight }}> → </Text></>
                    : null
                  }
                  <Text style={{ color: '#10b981' }}>{ch.to || '—'}</Text>
                </Text>
              )}
            </View>
          )) : (
            <Text style={{ fontSize: 12, color: C.textMuted }}>{log.description}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function HistoryTimeline({ history }) {
  const [allOpen, setAllOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: expanded ? 16 : 0 }}
        onPress={() => setExpanded(o => !o)}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={14} color={C.textMuted} />
        <Text style={s.sectionTitle}>Өзгөртүүлөр тарыхы</Text>
        <View style={{ backgroundColor: C.borderLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '600' }}>{history.length}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.textLight} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {expanded && history.map((log, i) => (
        <HistoryItem key={log._id || i} log={log} isLast={i === history.length - 1} />
      ))}
    </View>
  );
}

// ─── Add Aid Modal ────────────────────────────────────────────
const AID_TYPES = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];

function AidAddModal({ beneficiaryId, onClose, onSaved }) {
  const [form, setForm] = useState({
    aidType: 'Азык-түүлүк', amount: '', description: '', notes: '',
    givenAt: new Date().toISOString().split('T')[0],
  });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Галереяга уруксат жок' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Камерага уруксат жок' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSave = async () => {
    if (!form.description) {
      Toast.show({ type: 'error', text1: 'Сүрөттөмө жазыңыз' });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('beneficiary', beneficiaryId);
      fd.append('aidType', form.aidType);
      if (form.amount) fd.append('amount', String(Number(form.amount)));
      fd.append('description', form.description);
      if (form.notes) fd.append('notes', form.notes);
      fd.append('givenAt', form.givenAt);
      if (photo) {
        fd.append('photo', {
          uri: photo.uri,
          name: 'aid_photo.jpg',
          type: 'image/jpeg',
        });
      }
      await api.post('/aid-records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Toast.show({ type: 'success', text1: 'Жардам жазылды' });
      onSaved();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Жардам жазуу</Text>
            <TouchableOpacity onPress={onClose} style={s.modalClose}>
              <Ionicons name="close" size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.55 }}>
            <Text style={s.fieldLabel}>ЖАРДАМДЫН ТҮРҮ</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={form.aidType}
                onValueChange={v => setForm(p => ({ ...p, aidType: v }))}
                style={{ color: C.text }}
              >
                {AID_TYPES.map(t => <Picker.Item key={t} label={t} value={t} />)}
              </Picker>
            </View>

            <Text style={s.fieldLabel}>СУММАСЫ (СОМ)</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor={C.textLight}
              keyboardType="numeric"
              value={form.amount}
              onChangeText={v => setForm(p => ({ ...p, amount: v }))}
            />

            <Text style={s.fieldLabel}>СҮРӨТТӨМӨ *</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top', paddingTop: 11 }]}
              placeholder="Кандай жардам берилди..."
              placeholderTextColor={C.textLight}
              multiline
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
            />

            <Text style={s.fieldLabel}>БЕРИЛГЕН КҮНҮ</Text>
            <TextInput
              style={s.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.textLight}
              value={form.givenAt}
              onChangeText={v => setForm(p => ({ ...p, givenAt: v }))}
            />

            <Text style={s.fieldLabel}>ЭСКЕРТМЕ</Text>
            <TextInput
              style={s.input}
              placeholder="Кошумча маалымат..."
              placeholderTextColor={C.textLight}
              value={form.notes}
              onChangeText={v => setForm(p => ({ ...p, notes: v }))}
            />

            {/* Photo */}
            <Text style={s.fieldLabel}>СҮРӨТ</Text>
            {photo ? (
              <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                <TouchableOpacity
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => setPhoto(null)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <TouchableOpacity
                  style={[s.photoBtn, { flex: 1 }]}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={18} color={C.textMuted} />
                  <Text style={s.photoBtnText}>Камера</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.photoBtn, { flex: 1 }]}
                  onPress={pickPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={18} color={C.textMuted} />
                  <Text style={s.photoBtnText}>Галерея</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.textMuted }}>Жокко чыгаруу</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Сактоо</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────
export default function BeneficiaryDetailScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { user }   = useAuth();
  const { id }     = route.params;

  const [data,       setData]       = useState(null);
  const [aidRecords, setAidRecords] = useState([]);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aidModal,   setAidModal]   = useState(false);
  const [zoomUri,    setZoomUri]    = useState(null);

  const load = async () => {
    try {
      const [bRes, hRes] = await Promise.all([
        api.get(`/beneficiaries/${id}`),
        api.get(`/beneficiaries/${id}/history`).catch(() => ({ data: { data: [] } })),
      ]);
      setData(bRes.data.data || bRes.data);
      setAidRecords(bRes.data.aidRecords || []);
      setHistory(hRes.data.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Жүктөлгөн жок' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = () => {
    Alert.alert('Өчүрүү', 'Бул муктаждарды өчүрөсүзбү?', [
      { text: 'Жок', style: 'cancel' },
      {
        text: 'Өчүрүү', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/beneficiaries/${id}`);
            Toast.show({ type: 'success', text1: 'Өчүрүлдү' });
            navigation.goBack();
          } catch (err) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
          }
        },
      },
    ]);
  };

  const openMap = () => {
    if (!data?.lat || !data?.lng) return;
    const label = encodeURIComponent(data.fullName || 'Муктаж');
    const url = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`geo:${data.lat},${data.lng}?q=${data.lat},${data.lng}(${label})`)
    );
  };

  const canEdit = user?.isSuperadmin ||
    String(data?.registeredBy?._id || data?.registeredBy) === String(user?.foundation?._id);

  if (loading) return <Spinner />;
  if (!data) return (
    <View style={s.empty}>
      <Ionicons name="person-outline" size={40} color={C.textLight} style={{ marginBottom: 8, opacity: 0.4 }} />
      <Text style={s.emptyText}>Маалымат табылган жок</Text>
    </View>
  );

  const avatarColor = getAvatarColor(data.fullName);

  return (
    <>
      <ScrollView
        style={s.screen}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
      >
        {/* ── Profile card ── */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            {data.photo ? (
              <ZoomableImage
                uri={data.photo}
                style={{ width: 68, height: 68, borderRadius: 16 }}
                onPress={() => setZoomUri(data.photo)}
              />
            ) : (
              <View style={{ width: 68, height: 68, borderRadius: 16, backgroundColor: avatarColor, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{getInitials(data.fullName)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 }}>{data.fullName}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {data.needType    && <Badge label={data.needType} />}
                {data.status      && <Badge label={data.status} bg="#f1f5f9" color="#64748b" />}
                {data.guardianType && <Badge label={data.guardianType} bg={C.blueBg} color={C.blue} />}
              </View>
            </View>
          </View>

          <View style={s.divider} />

          {data.inn && (
            <InfoRow icon="card-outline" label="ИНН" value={data.inn} mono />
          )}
          {data.birthDate && (
            <InfoRow icon="calendar-outline" label="Туулган күнү" value={new Date(data.birthDate).toLocaleDateString('ru-RU')} />
          )}
          {data.phone && (
            <InfoRow icon="call-outline" label="Телефон" value={data.phone} />
          )}
          {data.address && (
            <InfoRow icon="location-outline" label="Дареги" value={data.address} />
          )}
          {(data.region || data.district) && (
            <InfoRow icon="map-outline" label="Облус / Район" value={[data.region, data.district, data.village].filter(Boolean).join(' › ')} />
          )}
          {data.childrenCount > 0 && (
            <InfoRow icon="people-outline" label="Балдары" value={`${data.childrenCount} бала`} />
          )}
          {data.comments && (
            <View style={{ marginTop: 4, borderLeftWidth: 2, borderLeftColor: C.borderLight, paddingLeft: 10 }}>
              <Text style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', lineHeight: 18 }}>{data.comments}</Text>
            </View>
          )}

          {/* Map button */}
          {data.lat && data.lng && (
            <TouchableOpacity style={s.mapBtn} onPress={openMap} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={15} color={C.blue} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.blue }}>Картадан көрүү</Text>
              <Ionicons name="open-outline" size={13} color={C.blue} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          <View style={[s.divider, { marginTop: 12 }]} />
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12, color: C.textMuted }}>Каттаган:</Text>
            {data.registeredBy?.name && (
              <Text style={{ fontSize: 12, color: C.text, fontWeight: '600' }}>{data.registeredBy.name}</Text>
            )}
            {data.registeredByUser?.name && (
              <Text style={{ fontSize: 12, color: C.textMuted }}>• {data.registeredByUser.name}</Text>
            )}
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#10b981', flex: 1.2 }]}
            onPress={() => setAidModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={[s.actionBtnText, { color: '#fff' }]}>Жардам жазуу</Text>
          </TouchableOpacity>
          {canEdit && (
            <>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.blueBg }]}
                onPress={() => navigation.navigate('BeneficiaryEdit', { id, data })}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil-outline" size={16} color={C.blue} />
                <Text style={[s.actionBtnText, { color: C.blue }]}>Өзгөртүү</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.redBg }]}
                onPress={handleDelete}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={16} color={C.red} />
                <Text style={[s.actionBtnText, { color: C.red }]}>Өчүрүү</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Spouse ── */}
        {data.spouse?.fullName && (
          <View style={s.card}>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Үй-бүлөсү</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { label: 'Байланышы', value: data.spouse.relation },
                { label: 'Аты-жөнү',  value: data.spouse.fullName },
                { label: 'ИНН',       value: data.spouse.inn },
                { label: 'Телефон',   value: data.spouse.phone },
                { label: 'Иштейби',   value: data.spouse.employed ? 'Иштейт' : 'Иштебейт' },
              ].filter(i => i.value).map(({ label, value }) => (
                <View key={label} style={{ width: '46%' }}>
                  <Text style={s.gridLabel}>{label.toUpperCase()}</Text>
                  <Text style={s.gridValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Children ── */}
        {data.children?.length > 0 && (
          <View style={s.card}>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>
              Балдары <Text style={{ color: C.textLight, fontWeight: '500', textTransform: 'none' }}>({data.children.length})</Text>
            </Text>
            {data.children.map((child, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < data.children.length - 1 ? 1 : 0, borderBottomColor: C.borderLight }}
              >
                <Text style={{ fontSize: 12, color: C.textLight, width: 20, fontWeight: '600' }}>{i + 1}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: '600' }}>{child.fullName || '—'}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>{child.inn || '—'}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>
                  {child.birthDate ? new Date(child.birthDate).toLocaleDateString('ru-RU') : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Clothing sizes ── */}
        {(data.clothingSize || data.shoeSize || data.spouse?.clothingSize || data.spouse?.shoeSize || data.children?.some(c => c.clothingSize || c.shoeSize)) && (
          <View style={s.card}>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Кийим өлчөмдөрү</Text>
            {/* Header row */}
            <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 4 }}>
              <Text style={{ flex: 2, fontSize: 10, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>Аты-жөнү</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>Кийим</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>Бут кийим</Text>
            </View>
            {/* Main person */}
            {(data.clothingSize || data.shoeSize) && (
              <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                <Text style={{ flex: 2, fontSize: 13, fontWeight: '700', color: C.text }} numberOfLines={1}>{data.fullName}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{data.clothingSize || '—'}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{data.shoeSize || '—'}</Text>
              </View>
            )}
            {/* Spouse */}
            {(data.spouse?.clothingSize || data.spouse?.shoeSize) && (
              <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                <Text style={{ flex: 2, fontSize: 13, color: C.text }} numberOfLines={1}>{data.spouse.fullName}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{data.spouse.clothingSize || '—'}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{data.spouse.shoeSize || '—'}</Text>
              </View>
            )}
            {/* Children */}
            {data.children?.filter(c => c.clothingSize || c.shoeSize).map((child, i, arr) => (
              <View key={i} style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.borderLight }}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 11, color: C.textLight, fontWeight: '600' }}>{i + 1}</Text>
                  <Text style={{ fontSize: 13, color: C.text }} numberOfLines={1}>{child.fullName || `${i + 1}-бала`}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{child.clothingSize || '—'}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.text }}>{child.shoeSize || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Aid records ── */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Text style={s.sectionTitle}>Жардам тарыхы</Text>
            {aidRecords.length > 0 && (
              <View style={{ backgroundColor: C.borderLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '600' }}>{aidRecords.length}</Text>
              </View>
            )}
          </View>
          {aidRecords.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
              <Ionicons name="heart-outline" size={28} color={C.textLight} style={{ opacity: 0.5 }} />
              <Text style={s.emptyText}>Жардам жазылган жок</Text>
            </View>
          ) : (
            aidRecords.map((item, i) => (
              <AidAccordion key={item._id || i} item={item} isLast={i === aidRecords.length - 1} onZoom={setZoomUri} />
            ))
          )}
        </View>

        {/* ── History ── */}
        {history.length > 0 && <HistoryTimeline history={history} />}
      </ScrollView>

      {aidModal && (
        <AidAddModal
          beneficiaryId={id}
          onClose={() => setAidModal(false)}
          onSaved={() => { setAidModal(false); load(); }}
        />
      )}
      {zoomUri && <PhotoZoom uri={zoomUri} onClose={() => setZoomUri(null)} />}
    </>
  );
}

// ─── Shared InfoRow ───────────────────────────────────────────
function InfoRow({ icon, label, value, mono }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={14} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.infoValue, mono && { fontVariant: ['tabular-nums'] }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  card:          { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  divider:       { height: 1, backgroundColor: C.borderLight, marginBottom: 12 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  infoIcon:      { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  infoLabel:     { fontSize: 11, color: C.textMuted, marginBottom: 1 },
  infoValue:     { fontSize: 14, color: C.text, fontWeight: '500' },
  mapBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: C.blueBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: C.blue + '33' },
  actionsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridLabel:     { fontSize: 10, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  gridValue:     { fontSize: 13, color: C.text, fontWeight: '600' },
  // Aid accordion
  aidHeader:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  aidBody:       { paddingBottom: 14 },
  aidGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: C.bg, borderRadius: 12, padding: 12 },
  aidGridItem:   { width: '44%' },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle:    { fontSize: 17, fontWeight: '800', color: C.text },
  modalClose:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  modalFooter:   { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: C.bg },
  saveBtn:       { flex: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  fieldLabel:    { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input:         { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  pickerWrap:    { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  photoBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  photoBtnText:  { fontSize: 13, fontWeight: '500', color: C.textMuted },
  empty:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:     { fontSize: 13, color: C.textLight, textAlign: 'center' },
});
