import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/axios';
import StatusBadge from '../components/ui/StatusBadge';
import { C } from '../config/colors';

export default function QuickCheckScreen() {
  const navigation = useNavigation();
  const [inn,     setInn]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [notFound,setNotFound]= useState(false);

  const handleCheck = async () => {
    if (inn.length < 6) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const res = await api.post('/beneficiaries/check-inn', { inn: inn.trim() });
      if (res.data.exists) {
        setResult(res.data.beneficiary || res.data.data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="search" size={28} color={C.primary} />
          </View>
          <Text style={s.heroTitle}>Тез текшерүү</Text>
          <Text style={s.heroSub}>ИНН боюнча муктаждарды тезден табыңыз</Text>
        </View>

        <View style={s.searchCard}>
          <Text style={s.label}>ИНН номери</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={inn}
              onChangeText={setInn}
              placeholder="14 орундуу ИНН"
              placeholderTextColor={C.textLight}
              keyboardType="numeric"
              maxLength={14}
              onSubmitEditing={handleCheck}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[s.btn, (loading || inn.length < 6) && { opacity: 0.5 }]}
              onPress={handleCheck}
              disabled={loading || inn.length < 6}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="search" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Not found */}
        {notFound && (
          <View style={s.notFound}>
            <Ionicons name="person-remove-outline" size={32} color={C.textLight} />
            <Text style={s.notFoundTitle}>Табылган жок</Text>
            <Text style={s.notFoundSub}>Бул ИНН боюнча муктаждар жок</Text>
            <TouchableOpacity
              style={s.registerBtn}
              onPress={() => navigation.navigate('BeneficiaryCreate')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={14} color={C.primary} />
              <Text style={s.registerBtnText}>Жаңы катоо</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Found */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultTop}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {result.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultName}>{result.fullName}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <StatusBadge value={result.status} />
                  {result.needType ? <StatusBadge value={result.needType} /> : null}
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {result.phone   ? <Text style={s.detail}><Text style={s.detailLabel}>Тел: </Text>{result.phone}</Text> : null}
            {result.address ? <Text style={s.detail}><Text style={s.detailLabel}>Дарек: </Text>{result.address}</Text> : null}
            {result.registeredBy?.name ? <Text style={s.detail}><Text style={s.detailLabel}>Фонд: </Text>{result.registeredBy.name}</Text> : null}

            <TouchableOpacity
              style={s.openBtn}
              onPress={() => navigation.navigate('BeneficiaryDetail', { id: result._id })}
              activeOpacity={0.85}
            >
              <Text style={s.openBtnText}>Толук маалымат</Text>
              <Ionicons name="arrow-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  hero:         { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  heroIcon:     { width: 64, height: 64, borderRadius: 18, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroTitle:    { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  heroSub:      { fontSize: 13, color: C.textMuted, textAlign: 'center' },
  searchCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  label:        { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 8 },
  inputRow:     { flexDirection: 'row', gap: 10 },
  input:        { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, letterSpacing: 1 },
  btn:          { width: 48, height: 48, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  notFound:     { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 16, gap: 8 },
  notFoundTitle:{ fontSize: 16, fontWeight: '700', color: C.text },
  notFoundSub:  { fontSize: 13, color: C.textMuted },
  registerBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primaryBg, borderWidth: 1, borderColor: C.primaryLight },
  registerBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  resultCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  resultTop:    { flexDirection: 'row', gap: 12, marginBottom: 14 },
  avatar:       { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { fontSize: 18, fontWeight: '800', color: C.primary },
  resultName:   { fontSize: 16, fontWeight: '800', color: C.text },
  divider:      { height: 1, backgroundColor: C.borderLight, marginBottom: 12 },
  detail:       { fontSize: 13, color: C.text, marginBottom: 6 },
  detailLabel:  { fontWeight: '600', color: C.textMuted },
  openBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primaryBg, borderWidth: 1, borderColor: C.primaryLight },
  openBtnText:  { fontSize: 14, fontWeight: '600', color: C.primary },
});
