import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import { C } from '../../config/colors';

const TYPE_CFG = {
  elon:     { label: 'Жарыя',   color: C.blue,    bg: C.blueBg  },
  yangilik: { label: 'Жаңылык', color: C.primary, bg: C.primaryBg },
  musobaqa: { label: 'Конкурс', color: C.amber,   bg: C.amberBg },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'Азыр';
  if (min < 60) return `${min} мин мурун`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h} саат мурун`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

// Strip markdown for plain display
function stripMd(text = '') {
  return text.replace(/[*#~_`]/g, '').replace(/\n{3,}/g, '\n\n');
}

export default function BlogDetailScreen() {
  const route    = useRoute();
  const { user } = useAuth();
  const { id }   = route.params;

  const [post,        setPost]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending,     setSending]     = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.data || res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Жүктөлгөн жок' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleLike = async () => {
    if (!user) return Toast.show({ type: 'info', text1: 'Лайк коюу үчүн кириңиз' });
    try {
      const res = await api.post(`/posts/${id}/like`);
      setPost(p => {
        const uid   = String(user._id);
        const likes = res.data.liked
          ? [...(p.likes || []), uid]
          : (p.likes || []).filter(x => String(x) !== uid);
        return { ...p, likes };
      });
    } catch { Toast.show({ type: 'error', text1: 'Ката кетти' }); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { text: commentText });
      setPost(p => ({ ...p, comments: [...(p.comments || []), res.data.data] }));
      setCommentText('');
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally { setSending(false); }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${post.title}\n\nhttps://fundsdb.app/blog/${id}` });
    } catch { /* cancelled */ }
  };

  if (loading) return <Spinner />;
  if (!post)   return <View style={s.empty}><Text style={s.emptyText}>Пост табылган жок</Text></View>;

  const cfg        = TYPE_CFG[post.type] || TYPE_CFG.elon;
  const liked      = (post.likes || []).some(x => String(x) === String(user?._id));
  const likeCount  = (post.likes || []).length;
  const comments   = post.comments || [];

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
    >
      {/* Image */}
      {post.image ? <Image source={{ uri: post.image }} style={s.image} resizeMode="cover" /> : null}

      <View style={s.content}>
        {/* Meta */}
        <View style={s.metaRow}>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
          </View>
          <Text style={s.metaText}>{post.foundation?.name}</Text>
          <Text style={s.metaDate}>{timeAgo(post.createdAt)}</Text>
        </View>

        {/* Title */}
        <Text style={s.title}>{post.title}</Text>

        {/* Body */}
        <Text style={s.body}>{stripMd(post.body)}</Text>

        {post.author?.name ? <Text style={s.author}>Автор: {post.author.name}</Text> : null}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionBtn, liked && { backgroundColor: C.redBg }]} onPress={handleLike} activeOpacity={0.8}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? C.red : C.textLight} />
            {likeCount > 0 ? <Text style={[s.actionText, liked && { color: C.red }]}>{likeCount}</Text> : null}
          </TouchableOpacity>

          <View style={s.actionBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={C.textLight} />
            {comments.length > 0 ? <Text style={s.actionText}>{comments.length}</Text> : null}
          </View>

          <View style={s.actionBtn}>
            <Ionicons name="eye-outline" size={16} color={C.textLight} />
            <Text style={s.actionText}>{post.views || 0}</Text>
          </View>

          <TouchableOpacity style={[s.actionBtn, { marginLeft: 'auto' }]} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={16} color={C.textMuted} />
            <Text style={s.actionText}>Бөлүшүү</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments */}
      <View style={s.commentsSection}>
        <Text style={s.commentsTitle}>
          Комментарийлер {comments.length > 0 ? <Text style={{ color: C.textMuted, fontWeight: '400' }}>{comments.length}</Text> : null}
        </Text>

        {comments.length === 0
          ? <Text style={s.noComments}>Азырынча комментарий жок</Text>
          : comments.map(c => (
            <View key={c._id} style={s.commentRow}>
              <View style={s.commentAvatar}>
                <Text style={s.commentAvatarText}>{(c.user?.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.commentMeta}>
                  <Text style={s.commentName}>{c.user?.name || '—'}</Text>
                  <Text style={s.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={s.commentText}>{c.text}</Text>
              </View>
            </View>
          ))
        }

        {user ? (
          <View style={s.inputRow}>
            <TextInput
              style={s.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Комментарий жазыңыз..."
              placeholderTextColor={C.textLight}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !commentText.trim() && { backgroundColor: C.border }]}
              onPress={handleComment}
              disabled={sending || !commentText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color={commentText.trim() ? '#fff' : C.textLight} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={s.loginHint}>Комментарий жазуу үчүн кириңиз</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: C.bg },
  image:           { width: '100%', height: 240 },
  content:         { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metaText:        { fontSize: 12, fontWeight: '600', color: C.text },
  metaDate:        { fontSize: 11, color: C.textLight },
  title:           { fontSize: 20, fontWeight: '800', color: C.text, lineHeight: 26, marginBottom: 14 },
  body:            { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 14 },
  author:          { fontSize: 12, color: C.textLight, marginBottom: 16 },
  actions:         { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 12 },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: C.bg },
  actionText:      { fontSize: 12, color: C.textLight, fontWeight: '500' },
  commentsSection: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  commentsTitle:   { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 16 },
  noComments:      { fontSize: 13, color: C.textLight, textAlign: 'center', paddingVertical: 16 },
  commentRow:      { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  commentAvatarText:{ fontSize: 13, fontWeight: '700', color: C.blue },
  commentMeta:     { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 3 },
  commentName:     { fontSize: 13, fontWeight: '700', color: C.text },
  commentTime:     { fontSize: 10, color: C.textLight },
  commentText:     { fontSize: 13, color: '#475569', lineHeight: 18 },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 12 },
  commentInput:    { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text, maxHeight: 80 },
  sendBtn:         { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  loginHint:       { fontSize: 13, color: C.primary, textAlign: 'center', marginTop: 12 },
  empty:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:       { fontSize: 14, color: C.textLight },
});
