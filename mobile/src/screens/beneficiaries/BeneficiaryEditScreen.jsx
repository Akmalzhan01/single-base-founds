import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../config/axios';
import { C } from '../../config/colors';

const STATUSES       = ['Карыя', 'Жесир', 'Майып', 'Зейнеткер', 'Жалгыз эне', 'Башка'];
const NEED_TYPES     = ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'];
const GUARDIAN_TYPES = ['Жалгыз', 'Эри', 'Аялы', 'Балдары', 'Башка'];
const REGIONS        = ['Бишкек ш.', 'Ош ш.', 'Чүй', 'Ош', 'Жалал-Абад', 'Баткен', 'Нарын', 'Талас', 'Ысык-Көл'];
const CHILDREN_COUNTS = Array.from({ length: 12 }, (_, i) => String(i));

function SectionCard({ title, children }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ label, required, children }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}{required ? <Text style={{ color: C.red }}> *</Text> : null}</Text>
      {children}
    </View>
  );
}

function FInput({ value, onChangeText, placeholder, keyboardType, multiline, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[s.input, focused && s.inputFocused, multiline && { height: 80, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.textLight}
      keyboardType={keyboardType}
      multiline={multiline}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...rest}
    />
  );
}

function Pills({ options, value, onChange }) {
  return (
    <View style={s.pillRow}>
      {options.map(o => (
        <TouchableOpacity
          key={o}
          style={[s.pill, value === o && s.pillActive]}
          onPress={() => onChange(o)}
          activeOpacity={0.8}
        >
          <Text style={[s.pillText, value === o && s.pillTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BeneficiaryEditScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { id, data: initial } = route.params;

  const [form, setForm] = useState({
    fullName:      initial?.fullName      || '',
    inn:           initial?.inn           || '',
    birthDate:     initial?.birthDate     ? initial.birthDate.slice(0, 10) : '',
    phone:         initial?.phone         || '',
    address:       initial?.address       || '',
    region:        initial?.region        || '',
    district:      initial?.district      || '',
    village:       initial?.village       || '',
    status:        initial?.status        || 'Карыя',
    needType:      initial?.needType      || 'Азык-түүлүк',
    childrenCount: String(initial?.childrenCount ?? '0'),
    guardianType:  initial?.guardianType  || 'Жалгыз',
    comments:      initial?.comments      || '',
    spouseRelation:  initial?.spouse?.relation  || '',
    spouseInn:       initial?.spouse?.inn       || '',
    spouseFullName:  initial?.spouse?.fullName  || '',
    spouseBirthDate: initial?.spouse?.birthDate ? initial.spouse.birthDate.slice(0, 10) : '',
    spousePhone:     initial?.spouse?.phone     || '',
    spouseEmployed:  initial?.spouse?.employed  ? 'Иштейт' : '',
  });

  const [children, setChildren] = useState(
    (initial?.children || []).map(c => ({
      fullName:  c.fullName  || '',
      birthDate: c.birthDate ? c.birthDate.slice(0, 10) : '',
      gender:    c.gender    || 'male',
    }))
  );

  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  const addChild = () => setChildren(p => [...p, { fullName: '', birthDate: '', gender: 'male' }]);
  const updateChild = (i, field, val) => setChildren(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const removeChild = (i) => setChildren(p => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.fullName.trim()) return Toast.show({ type: 'error', text1: 'Аты-жөнүн жазыңыз' });
    setSaving(true);
    try {
      const body = { ...form };
      if (body.childrenCount) body.childrenCount = Number(body.childrenCount);
      body.children = children;
      if (form.spouseFullName) {
        body.spouse = {
          relation:  form.spouseRelation || 'Күйөөсу',
          inn:       form.spouseInn,
          fullName:  form.spouseFullName,
          birthDate: form.spouseBirthDate,
          phone:     form.spousePhone,
          employed:  form.spouseEmployed === 'Иштейт',
        };
      }
      await api.put(`/beneficiaries/${id}`, body);
      Toast.show({ type: 'success', text1: 'Сакталды!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Ката кетти' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        <SectionCard title="Муктаж тууралуу маалымат">
          <Field label="ИНН">
            <FInput value={form.inn} onChangeText={set('inn')} placeholder="ИНН" keyboardType="numeric" maxLength={14} />
          </Field>
          <Field label="Аты-жөнү" required>
            <FInput value={form.fullName} onChangeText={set('fullName')} placeholder="Фамилия Аты Атасынын аты" />
          </Field>
          <Field label="Туулган күнү">
            <FInput value={form.birthDate} onChangeText={set('birthDate')} placeholder="ГГГГ-АА-КК" />
          </Field>
          <Field label="Телефон">
            <FInput value={form.phone} onChangeText={set('phone')} placeholder="+996 XXX XXX XXX" keyboardType="phone-pad" />
          </Field>
          <Field label="Дареги">
            <FInput value={form.address} onChangeText={set('address')} placeholder="Толук дарек" />
          </Field>
          <Field label="Абалы">
            <Pills options={STATUSES} value={form.status} onChange={set('status')} />
          </Field>
          <Field label="Муктаздыгы">
            <Pills options={NEED_TYPES} value={form.needType} onChange={set('needType')} />
          </Field>
          <Field label="Балдарынын саны">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CHILDREN_COUNTS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.numBtn, form.childrenCount === n && s.numBtnActive]}
                    onPress={() => set('childrenCount')(n)}
                  >
                    <Text style={[s.numBtnText, form.childrenCount === n && s.numBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Field>
          <Field label="Кимдин карамагында">
            <Pills options={GUARDIAN_TYPES} value={form.guardianType} onChange={set('guardianType')} />
          </Field>
          <Field label="Облус">
            <Pills options={REGIONS} value={form.region} onChange={set('region')} />
          </Field>
          <Field label="Район">
            <FInput value={form.district} onChangeText={set('district')} placeholder="Район" />
          </Field>
          <Field label="Айыл / Кент">
            <FInput value={form.village} onChangeText={set('village')} placeholder="Айыл же кент" />
          </Field>
          <Field label="Комментарий">
            <FInput value={form.comments} onChangeText={set('comments')} placeholder="Комментарий..." multiline />
          </Field>
        </SectionCard>

        <SectionCard title="Үй-бүлөсү тууралуу маалымат">
          <Field label="Күйөөсу / Аялы">
            <Pills
              options={['Күйөөсу', 'Аялы']}
              value={form.spouseRelation}
              onChange={v => set('spouseRelation')(form.spouseRelation === v ? '' : v)}
            />
          </Field>
          <Field label="Жубайынын ИНН сы">
            <FInput value={form.spouseInn} onChangeText={set('spouseInn')} placeholder="ИНН" keyboardType="numeric" />
          </Field>
          <Field label="Жубайынын аты-жөнү">
            <FInput value={form.spouseFullName} onChangeText={set('spouseFullName')} placeholder="Аты-жөнү" />
          </Field>
          <Field label="Жубайынын туулган күнү">
            <FInput value={form.spouseBirthDate} onChangeText={set('spouseBirthDate')} placeholder="ГГГГ-АА-КК" />
          </Field>
          <Field label="Жубайынын телефону">
            <FInput value={form.spousePhone} onChangeText={set('spousePhone')} placeholder="+996..." keyboardType="phone-pad" />
          </Field>
          <Field label="Иш абалы">
            <Pills
              options={['Иштейт', 'Иштебейт']}
              value={form.spouseEmployed}
              onChange={v => set('spouseEmployed')(form.spouseEmployed === v ? '' : v)}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Балдары тууралуу маалымат">
          {children.map((child, i) => (
            <View key={i} style={s.childCard}>
              <View style={s.childHeader}>
                <Text style={s.childIndex}>{i + 1}-бала</Text>
                <TouchableOpacity onPress={() => removeChild(i)}>
                  <Ionicons name="close-circle" size={18} color={C.red} />
                </TouchableOpacity>
              </View>
              <FInput value={child.fullName} onChangeText={v => updateChild(i, 'fullName', v)} placeholder="Аты-жөнү" />
              <View style={{ height: 8 }} />
              <FInput value={child.birthDate} onChangeText={v => updateChild(i, 'birthDate', v)} placeholder="Туулган күнү (ГГГГ-АА-КК)" />
              <View style={{ height: 8 }} />
              <Pills
                options={['Уул', 'Кыз']}
                value={child.gender === 'male' ? 'Уул' : 'Кыз'}
                onChange={v => updateChild(i, 'gender', v === 'Уул' ? 'male' : 'female')}
              />
            </View>
          ))}
          <TouchableOpacity style={s.addChildBtn} onPress={addChild} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={C.primary} />
            <Text style={s.addChildText}>Бала кошуу</Text>
          </TouchableOpacity>
        </SectionCard>

        <View style={s.btnRow}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>Жокко чыгаруу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Сактоо</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  section: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionBody: { padding: 16 },
  field:        { marginBottom: 16 },
  label:        { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 7 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.text, backgroundColor: '#f8fafc',
  },
  inputFocused: { borderColor: C.primary, backgroundColor: '#fff' },
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: C.border,
  },
  pillActive:     { backgroundColor: C.primary, borderColor: C.primary },
  pillText:       { fontSize: 12, fontWeight: '600', color: C.textMuted },
  pillTextActive: { color: '#fff' },
  numBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  numBtnActive:     { backgroundColor: C.primary, borderColor: C.primary },
  numBtnText:       { fontSize: 13, fontWeight: '600', color: C.textMuted },
  numBtnTextActive: { color: '#fff' },
  childCard: {
    backgroundColor: C.bg, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  childHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  childIndex:   { fontSize: 13, fontWeight: '700', color: C.text },
  addChildBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addChildText: { fontSize: 14, fontWeight: '600', color: C.primary },
  btnRow: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 20 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 2, backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
