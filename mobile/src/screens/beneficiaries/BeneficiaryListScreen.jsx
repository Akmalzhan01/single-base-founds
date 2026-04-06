import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { C } from '../../config/colors';

const FILTERS = [
  { key: '', label: 'Баары' },
  { key: 'active',   label: 'Активдүү' },
  { key: 'inactive', label: 'Активсыз' },
  { key: 'pending',  label: 'Күтүүдө' },
];

function BeneficiaryCard({ item, onPress }) {
  const initials = item.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardLeft}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{item.fullName}</Text>
          <Text style={s.inn}>ИНН: {item.inn || '—'}</Text>
          {item.phone ? <Text style={s.phone}>{item.phone}</Text> : null}
        </View>
      </View>
      <View style={s.cardRight}>
        <StatusBadge value={item.status} />
        <Ionicons name="chevron-forward" size={16} color={C.textLight} style={{ marginTop: 6 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function BeneficiaryListScreen() {
  const navigation = useNavigation();
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);

  const load = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/beneficiaries', { params });
      const list = res.data.data || [];
      const tot  = res.data.total || 0;
      setData(append ? prev => [...prev, ...list] : list);
      setTotal(tot);
      setHasMore(pg * 20 < tot);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [search, status]);

  // Debounce reload when search/status changes
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, false); }, 300);
    return () => clearTimeout(t);
  }, [search, status]);

  // Reload when screen comes back into focus (e.g. after create/edit/delete)
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useFocusEffect(useCallback(() => {
    setPage(1);
    loadRef.current(1, false);
  }, []));

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  return (
    <View style={s.screen}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={C.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Аты же ИНН боюнча..."
          placeholderTextColor={C.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status filters */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, status === f.key && s.filterBtnActive]}
            onPress={() => setStatus(f.key)}
          >
            <Text style={[s.filterLabel, status === f.key && s.filterLabelActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count + Add button */}
      <View style={s.countRow}>
        <Text style={s.countText}>Жалпы: {total} адам</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('BeneficiaryCreate')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.addBtnText}>Кошуу</Text>
        </TouchableOpacity>
      </View>

      {loading && page === 1
        ? <Spinner />
        : (
          <FlatList
            data={data}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <BeneficiaryCard
                item={item}
                onPress={() => navigation.navigate('BeneficiaryDetail', { id: item._id })}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, false); }} tintColor={C.primary} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={40} color={C.border} />
                <Text style={s.emptyText}>Муктаждар табылган жок</Text>
              </View>
            }
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, margin: 16, marginBottom: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  filterRow:   { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterBtn:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterLabelActive: { color: '#fff' },
  countRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  countText:   { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:  { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  avatar:    { width: 42, height: 42, borderRadius: 11, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center' },
  avatarText:{ fontSize: 15, fontWeight: '700', color: C.primary },
  name:      { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  inn:       { fontSize: 11, color: C.textMuted },
  phone:     { fontSize: 11, color: C.textLight },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.textLight },
});
