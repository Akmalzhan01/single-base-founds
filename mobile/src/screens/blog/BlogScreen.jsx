import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../config/axios';
import Spinner from '../../components/ui/Spinner';
import { C } from '../../config/colors';

const TYPE_CFG = {
  elon:     { label: 'Жарыя',   color: C.blue,    bg: C.blueBg  },
  yangilik: { label: 'Жаңылык', color: C.primary, bg: C.primaryBg },
  musobaqa: { label: 'Конкурс', color: C.amber,   bg: C.amberBg },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CFG[type] || TYPE_CFG.elon;
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'Азыр';
  if (min < 60) return `${min} мин мурун`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h} саат мурун`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d} күн мурун`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

function PostCard({ item, onPress }) {
  const likeCount    = item.likes?.length || 0;
  const commentCount = item.comments?.length || 0;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.cardImage} resizeMode="cover" />
      ) : null}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <TypeBadge type={item.type} />
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.body ? <Text style={s.cardBody2} numberOfLines={3}>{item.body.replace(/[#*~_]/g, '')}</Text> : null}
        <View style={s.cardFooter}>
          <Text style={s.foundation} numberOfLines={1}>{item.foundation?.name}</Text>
          <View style={s.stats}>
            <View style={s.stat}>
              <Ionicons name="heart-outline" size={12} color={C.textLight} />
              <Text style={s.statText}>{likeCount}</Text>
            </View>
            <View style={s.stat}>
              <Ionicons name="chatbubble-outline" size={12} color={C.textLight} />
              <Text style={s.statText}>{commentCount}</Text>
            </View>
            <View style={s.stat}>
              <Ionicons name="eye-outline" size={12} color={C.textLight} />
              <Text style={s.statText}>{item.views || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const FILTERS = [
  { key: '', label: 'Баары' },
  { key: 'elon',     label: 'Жарыя' },
  { key: 'yangilik', label: 'Жаңылык' },
  { key: 'musobaqa', label: 'Конкурс' },
];

export default function BlogScreen() {
  const navigation = useNavigation();
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [filter,    setFilter]    = useState('');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filter) params.type = filter;
      const res = await api.get('/posts', { params });
      setPosts(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  // Reload when filter changes
  useEffect(() => { setLoading(true); load(); }, [load]);

  // Reload when screen regains focus
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useFocusEffect(useCallback(() => { loadRef.current(); }, []));

  return (
    <View style={s.screen}>
      {/* Filter tabs */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <Spinner />
        : (
          <FlatList
            data={posts}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <PostCard item={item} onPress={() => navigation.navigate('BlogDetail', { id: item._id })} />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="newspaper-outline" size={40} color={C.border} />
                <Text style={s.emptyText}>Постлор жок</Text>
              </View>
            }
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: C.bg },
  filterRow:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterTextActive: { color: '#fff' },
  card:       { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardImage:  { width: '100%', height: 180 },
  cardBody:   { padding: 14 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  time:       { fontSize: 11, color: C.textLight },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6, lineHeight: 20 },
  cardBody2:  { fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 10 },
  foundation: { fontSize: 11, fontWeight: '600', color: C.textMuted, flex: 1 },
  stats:      { flexDirection: 'row', gap: 10 },
  stat:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText:   { fontSize: 11, color: C.textLight },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:  { fontSize: 14, color: C.textLight },
});
