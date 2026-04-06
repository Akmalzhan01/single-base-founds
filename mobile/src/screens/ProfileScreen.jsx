import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import { C } from '../config/colors';

const AVATAR_COLORS = ['#3b82f6','#10b981','#a855f7','#f43f5e','#f59e0b','#06b6d4'];
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function InfoCard({ user }) {
  const role = user?.isSuperadmin ? 'Супер Администратор' : user?.role === 'fond_admin' ? 'Фонд Администратору' : 'Кызматкер';
  const avatarColor = getAvatarColor(user?.name);
  return (
    <View style={s.profileCard}>
      <View style={[s.avatar, { backgroundColor: avatarColor }]}>
        <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <Text style={s.userName}>{user?.name}</Text>
      <Text style={s.userPhone}>{user?.phone}</Text>
      <View style={s.roleBadge}>
        <Text style={s.roleText}>{role}</Text>
      </View>
      {user?.foundation?.name ? (
        <View style={s.foundationRow}>
          <Ionicons name="business-outline" size={13} color={C.primary} />
          <Text style={s.foundationText}>{user.foundation.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MenuItem({ icon, label, color, onPress, dangerous }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.menuIcon, { backgroundColor: dangerous ? C.redBg : C.bg }]}>
        <Ionicons name={icon} size={18} color={color || C.textMuted} />
      </View>
      <Text style={[s.menuLabel, dangerous && { color: C.red }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.border} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();

  const [editing,      setEditing]      = useState(false);
  const [name,         setName]         = useState(user?.name || '');
  const [oldPwd,       setOldPwd]       = useState('');
  const [newPwd,       setNewPwd]       = useState('');
  const [saving,       setSaving]       = useState(false);
  const [changingPwd,  setChangingPwd]  = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim() });
      setUser(res.data.data || res.data.user || { ...user, name: name.trim() });
      Toast.show({ type: 'success', text1: 'Аты сакталды' });
      setEditing(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) return Toast.show({ type: 'error', text1: 'Маалыматты толтуруңуз' });
    if (newPwd.length < 6)  return Toast.show({ type: 'error', text1: 'Сырсөз 6 символдон кем болбосун' });
    setSaving(true);
    try {
      await api.put('/auth/profile', { currentPassword: oldPwd, password: newPwd });
      Toast.show({ type: 'success', text1: 'Сырсөз өзгөртүлдү' });
      setOldPwd(''); setNewPwd(''); setChangingPwd(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Чыгуу', 'Аккаунттан чыгасызбы?', [
      { text: 'Жок', style: 'cancel' },
      { text: 'Чыгуу', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <InfoCard user={user} />

      {/* Edit name */}
      <Section title="Жеке маалымат">
        {editing ? (
          <View style={s.editRow}>
            <TextInput
              style={s.editInput}
              value={name}
              onChangeText={setName}
              placeholder="Аты-жөнү"
              placeholderTextColor={C.textLight}
            />
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveName} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Сактоо</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditing(false); setName(user?.name || ''); }}>
              <Ionicons name="close" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <MenuItem icon="person-outline" label={`Аты: ${user?.name}`} onPress={() => setEditing(true)} />
        )}
        <MenuItem icon="call-outline" label={`Тел: ${user?.phone}`} />
      </Section>

      {/* Password */}
      <Section title="Коопсуздук">
        {changingPwd ? (
          <View style={s.pwdForm}>
            <TextInput
              style={s.editInput}
              value={oldPwd}
              onChangeText={setOldPwd}
              placeholder="Учурдагы сырсөз"
              placeholderTextColor={C.textLight}
              secureTextEntry
            />
            <TextInput
              style={[s.editInput, { marginTop: 8 }]}
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Жаңы сырсөз"
              placeholderTextColor={C.textLight}
              secureTextEntry
            />
            <View style={s.pwdBtns}>
              <TouchableOpacity style={[s.saveBtn, { flex: 1 }, saving && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Өзгөртүү</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setChangingPwd(false); setOldPwd(''); setNewPwd(''); }}>
                <Ionicons name="close" size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <MenuItem icon="lock-closed-outline" label="Сырсөздү өзгөртүү" onPress={() => setChangingPwd(true)} />
        )}
      </Section>

      {/* Logout */}
      <Section title="Аккаунт">
        <MenuItem icon="log-out-outline" label="Чыгуу" dangerous onPress={handleLogout} />
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  profileCard:   { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  avatar:        { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:    { fontSize: 28, fontWeight: '800', color: '#fff' },
  userName:      { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  userPhone:     { fontSize: 14, color: C.textMuted, marginBottom: 10 },
  roleBadge:     { backgroundColor: C.primaryBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  roleText:      { fontSize: 12, fontWeight: '600', color: C.primary },
  foundationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  foundationText:{ fontSize: 12, color: C.textMuted },
  section:       { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  menuIcon:      { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  menuLabel:     { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput:     { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  saveBtn:       { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  cancelBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  pwdForm:       { gap: 0 },
  pwdBtns:       { flexDirection: 'row', gap: 8, marginTop: 8 },
});
