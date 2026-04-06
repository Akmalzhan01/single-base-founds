import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { C } from '../config/colors';

const AVATAR_GRADIENTS = [
  ['#3b82f6', '#6366f1'],
  ['#10b981', '#059669'],
  ['#a855f7', '#7c3aed'],
  ['#f43f5e', '#db2777'],
  ['#f59e0b', '#f97316'],
  ['#06b6d4', '#0284c7'],
];

function getAvatarColor(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, bg, onPress }) {
  return (
    <TouchableOpacity style={[s.actionCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.actionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[s.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const endpoint = user?.isSuperadmin ? '/dashboard/global' : '/dashboard/stats';
      const res = await api.get(endpoint);
      setStats(res.data.data || res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Spinner />;

  const avatarColors = getAvatarColor(user?.name);
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#34d399" />
      }
    >
      {/* Dark header banner */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>FD</Text>
          </View>
          <View style={[s.rolePill, user?.isSuperadmin && { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
            <Text style={[s.rolePillText, user?.isSuperadmin && { color: '#a5b4fc' }]}>
              {user?.isSuperadmin ? 'Супер Админ' : 'Кызматкер'}
            </Text>
          </View>
        </View>

        <View style={s.headerUser}>
          <View style={[s.avatar, { backgroundColor: avatarColors[0] }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={s.greeting}>Саламатсызбы,</Text>
            <Text style={s.userName}>{user?.name || '—'}</Text>
            {user?.foundation?.name ? (
              <View style={s.foundationRow}>
                <Ionicons name="business-outline" size={11} color="#6ee7b7" />
                <Text style={s.foundationName}>{user.foundation.name}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={s.body}>
        <Text style={s.sectionTitle}>Статистика</Text>
        <View style={s.statsGrid}>
          <StatCard
            label="Жалпы муктаждар"
            value={stats?.total ?? stats?.totalBeneficiaries}
            icon="people-outline" color={C.primary} bg={C.primaryBg}
          />
          <StatCard
            label="Активдүү"
            value={stats?.active ?? stats?.activeBeneficiaries}
            icon="checkmark-circle-outline" color="#16a34a" bg="#f0fdf4"
          />
          <StatCard
            label="Бул айда"
            value={stats?.thisMonth ?? stats?.thisMonthBeneficiaries}
            icon="calendar-outline" color={C.blue} bg={C.blueBg}
          />
          <StatCard
            label="Жардам берилди"
            value={stats?.totalAid ?? stats?.totalAidRecords}
            icon="heart-outline" color={C.amber} bg={C.amberBg}
          />
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Тез аракет</Text>
        <View style={s.actionsGrid}>
          <QuickAction
            icon="person-add-outline" label="Кошуу"
            color={C.primary} bg="#fff"
            onPress={() => navigation.navigate('BeneficiaryTab', { screen: 'BeneficiaryCreate' })}
          />
          <QuickAction
            icon="search-outline" label="Текшерүү"
            color={C.blue} bg="#fff"
            onPress={() => navigation.navigate('BeneficiaryTab', { screen: 'QuickCheck' })}
          />
          <QuickAction
            icon="list-outline" label="Тизме"
            color="#7c3aed" bg="#fff"
            onPress={() => navigation.navigate('BeneficiaryTab', { screen: 'BeneficiaryList' })}
          />
          <QuickAction
            icon="newspaper-outline" label="Блог"
            color={C.amber} bg="#fff"
            onPress={() => navigation.navigate('BlogTab')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    backgroundColor: '#0d0d18',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  logoText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  rolePill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  rolePillText: { fontSize: 11, fontWeight: '600', color: '#6ee7b7' },
  headerUser:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:      { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  greeting:    { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  userName:    { fontSize: 17, fontWeight: '800', color: '#f9fafb' },
  foundationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  foundationName: { fontSize: 11, color: '#6ee7b7' },

  /* Body */
  body: { padding: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12, marginTop: 4,
  },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statIcon:  { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },

  /* Quick Actions */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:  {
    flex: 1, minWidth: '44%', borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  actionIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});
