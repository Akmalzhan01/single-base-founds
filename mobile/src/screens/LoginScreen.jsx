import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { C } from '../config/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Маалыматты толтуруңуз' });
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Кириүү ката' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>FD</Text>
          </View>
          <Text style={s.logoTitle}>FundsDB</Text>
          <Text style={s.logoSub}>Иш кызматкерлер үчүн</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Кирүү</Text>

          <View style={s.inputWrap}>
            <Text style={s.label}>Телефон номери</Text>
            <TextInput
              style={s.input}
              placeholder="+996 XXX XXX XXX"
              placeholderTextColor={C.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Сырсөз</Text>
            <View style={s.pwdRow}>
              <TextInput
                style={[s.input, { flex: 1, borderWidth: 0, paddingRight: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={C.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!pwdVisible}
              />
              <TouchableOpacity onPress={() => setPwdVisible(v => !v)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{pwdVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Кирүү</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>FundsDB © 2024</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoText:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  logoTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  logoSub:   { color: '#4b5563', fontSize: 13, marginTop: 4 },
  card: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 20 },
  inputWrap: { marginBottom: 16 },
  label:     { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, backgroundColor: '#fff',
  },
  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, overflow: 'hidden',
  },
  eyeBtn: { padding: 8 },
  btn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer:  { color: '#374151', fontSize: 12, marginTop: 32 },
});
