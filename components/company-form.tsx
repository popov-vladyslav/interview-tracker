import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SelectField } from '@/components/select-field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCompanies } from '@/lib/companies-context';
import { Company, STATUSES, STATUS_COLORS, WORK_MODES, emptyCompany } from '@/lib/types';

type TabId = 'info' | 'stages' | 'contacts' | 'notes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'stages', label: 'Stages' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'notes', label: 'Notes' },
];

const STATUS_DOTS = Object.fromEntries(
  STATUSES.map((s) => [s, STATUS_COLORS[s].dot]),
);

interface Props {
  companyId?: string; // undefined = add mode
}

export function CompanyForm({ companyId }: Props) {
  const router = useRouter();
  const { companies, addCompany, updateCompany } = useCompanies();

  const existing = companyId ? companies.find((c) => c.id === companyId) : undefined;
  const [form, setForm] = useState<Company>(() =>
    existing ? { ...existing, stages: existing.stages.map((s) => ({ ...s })), contacts: [...existing.contacts] } : emptyCompany(),
  );
  const [tab, setTab] = useState<TabId>('info');
  const [contactDraft, setContactDraft] = useState({ name: '', role: '', email: '' });

  // Keep form in sync if existing company changes (e.g. after a reload)
  useEffect(() => {
    if (existing) {
      setForm({ ...existing, stages: existing.stages.map((s) => ({ ...s })), contacts: [...existing.contacts] });
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof Company>(k: K, v: Company[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setStageField(idx: number, field: 'completed' | 'date' | 'feedback', val: string | boolean) {
    setForm((f) => ({
      ...f,
      stages: f.stages.map((s, i) => (i === idx ? { ...s, [field]: val } : s)),
    }));
  }

  function addContact() {
    if (!contactDraft.name.trim()) return;
    setForm((f) => ({ ...f, contacts: [...f.contacts, { ...contactDraft }] }));
    setContactDraft({ name: '', role: '', email: '' });
  }

  function removeContact(idx: number) {
    setForm((f) => ({ ...f, contacts: f.contacts.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const toSave: Company = {
      ...form,
      lastActivity: new Date().toISOString().split('T')[0],
      currentStage: form.stages.filter((s) => s.completed).length,
    };
    if (existing) {
      await updateCompany(toSave);
    } else {
      await addCompany(toSave);
    }
    router.back();
  }

  const canSave = form.name.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4, paddingTop: 8, paddingBottom: 4 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexGrow: 0 }}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
              setTab(t.id);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: tab === t.id ? '#222' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: tab === t.id ? '#222' : '#999',
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Form body */}
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {tab === 'info' && (
          <>
            <Field
              label="Company Name *"
              value={form.name}
              onChange={(v) => set('name', v)}
              placeholder="e.g. Stripe"
              autoFocus
            />
            <Field
              label="Role / Position"
              value={form.role}
              onChange={(v) => set('role', v)}
              placeholder="e.g. Senior React Native Dev"
            />
            <SelectField
              label="Status"
              value={form.status}
              options={STATUSES}
              onChange={(v) => set('status', v as Company['status'])}
              dotColors={STATUS_DOTS}
            />
            <SelectField
              label="Work Mode"
              value={form.remote}
              options={WORK_MODES}
              onChange={(v) => set('remote', v as Company['remote'])}
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => set('location', v)}
              placeholder="e.g. Berlin, Germany"
            />
            <Field
              label="Salary / Rate"
              value={form.salary}
              onChange={(v) => set('salary', v)}
              placeholder="e.g. €80k–100k"
            />
            <Field
              label="Applied Date (YYYY-MM-DD)"
              value={form.appliedDate}
              onChange={(v) => set('appliedDate', v)}
              placeholder="2026-03-27"
              keyboardType="numbers-and-punctuation"
            />
          </>
        )}

        {tab === 'stages' && (
          <>
            {form.stages.map((s, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: 12,
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  borderRadius: 12,
                  borderCurve: 'continuous',
                }}
              >
                <Pressable
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setStageField(i, 'completed', !s.completed);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: s.completed ? '#43A047' : '#ccc',
                    backgroundColor: s.completed ? '#43A047' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {s.completed && <IconSymbol name="checkmark" size={13} color="#fff" weight="bold" />}
                </Pressable>

                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>{s.name}</Text>
                  <TextInput
                    value={s.date}
                    onChangeText={(v) => setStageField(i, 'date', v)}
                    placeholder="Date (YYYY-MM-DD)"
                    style={inputStyle}
                    keyboardType="numbers-and-punctuation"
                  />
                  <TextInput
                    value={s.feedback}
                    onChangeText={(v) => setStageField(i, 'feedback', v)}
                    placeholder="Feedback / notes for this stage…"
                    multiline
                    style={[inputStyle, { minHeight: 52 }]}
                  />
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'contacts' && (
          <>
            {form.contacts.map((ct, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>{ct.name}</Text>
                  <Text style={{ fontSize: 13, color: '#888' }}>
                    {ct.role}
                    {ct.email ? ` · ${ct.email}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeContact(i)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    padding: 6,
                    borderRadius: 6,
                    backgroundColor: pressed ? 'rgba(239,83,80,0.08)' : 'transparent',
                  })}
                >
                  <IconSymbol name="trash" size={16} color="#EF5350" />
                </Pressable>
              </View>
            ))}

            <View
              style={{
                padding: 14,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: 12,
                borderCurve: 'continuous',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#999' }}>
                Add Contact
              </Text>
              <TextInput
                value={contactDraft.name}
                onChangeText={(v) => setContactDraft((d) => ({ ...d, name: v }))}
                placeholder="Name"
                style={inputStyle}
              />
              <TextInput
                value={contactDraft.role}
                onChangeText={(v) => setContactDraft((d) => ({ ...d, role: v }))}
                placeholder="Role (HR / Tech Lead / CTO)"
                style={inputStyle}
              />
              <TextInput
                value={contactDraft.email}
                onChangeText={(v) => setContactDraft((d) => ({ ...d, email: v }))}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={inputStyle}
              />
              <Pressable
                onPress={addContact}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  backgroundColor: pressed ? '#444' : '#555',
                })}
              >
                <IconSymbol name="plus" size={14} color="#fff" weight="semibold" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Add Contact</Text>
              </Pressable>
            </View>
          </>
        )}

        {tab === 'notes' && (
          <TextInput
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            placeholder="General notes, compensation details, red flags, why you're excited about this role…"
            multiline
            style={[inputStyle, { minHeight: 160 }]}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 10,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 10,
            borderCurve: 'continuous',
            borderWidth: 1.5,
            borderColor: '#e0e0e0',
            backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent',
          })}
        >
          <Text style={{ fontSize: 14 }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 10,
            borderCurve: 'continuous',
            backgroundColor: pressed ? '#444' : '#222',
            opacity: canSave ? 1 : 0.4,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
            {existing ? 'Save Changes' : 'Add Company'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputStyle = {
  fontSize: 14,
  padding: 11,
  borderWidth: 1.5,
  borderColor: '#e0e0e0',
  borderRadius: 10,
  borderCurve: 'continuous' as const,
  backgroundColor: 'transparent',
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'numbers-and-punctuation';
}

function Field({ label, value, onChange, placeholder, autoFocus, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: '#999',
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        style={inputStyle}
      />
    </View>
  );
}
