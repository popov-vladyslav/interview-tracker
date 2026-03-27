import * as Haptics from 'expo-haptics';
import { Alert, Pressable, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCompanies } from '@/lib/companies-context';
import { Company } from '@/lib/types';

interface Props {
  company: Company;
  onEdit: () => void;
}

export function CompanyCard({ company: c, onEdit }: Props) {
  const { toggleStage, deleteCompany } = useCompanies();

  const completedCount = c.stages.filter((s) => s.completed).length;
  const progress = completedCount / c.stages.length;

  function handleEdit() {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  }

  function handleDelete() {
    Alert.alert('Delete company?', 'This will archive the entry in Notion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCompany(c.id),
      },
    ]);
  }

  function handleStageToggle(idx: number) {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleStage(c.id, idx);
  }

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#ebebeb',
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
        marginBottom: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Header row: name/role + edit/delete ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
            {c.name || 'Unnamed'}
          </Text>
          <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }} numberOfLines={1}>
            {c.role || 'No role specified'}
          </Text>
        </View>

        {/* Action buttons always visible */}
        <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Pressable
            onPress={handleEdit}
            hitSlop={8}
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 7,
              backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
            })}
          >
            <IconSymbol name="pencil" size={15} color="#888" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 7,
              backgroundColor: pressed ? 'rgba(239,83,80,0.08)' : 'transparent',
            })}
          >
            <IconSymbol name="trash" size={15} color="#888" />
          </Pressable>
        </View>
      </View>

      {/* ── Tags ── */}
      {(c.remote || c.location || c.salary) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {[c.remote, c.location, c.salary].filter(Boolean).map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: 'rgba(0,0,0,0.04)',
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 6,
                borderCurve: 'continuous',
              }}
            >
              <Text style={{ fontSize: 12, color: '#555' }}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Progress bar ── */}
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text style={{ fontSize: 12, color: '#999' }}>
            Stage {completedCount}/{c.stages.length}
          </Text>
          <Text style={{ fontSize: 12, color: '#555', fontWeight: '600' }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={{ height: 5, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              backgroundColor: '#43A047',
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {/* ── Stage checklist (always visible) ── */}
      <View style={{ marginTop: 14, gap: 10 }}>
        {c.stages.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => handleStageToggle(i)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: s.completed ? '#43A047' : '#ccc',
                backgroundColor: s.completed ? '#43A047' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {s.completed && (
                <IconSymbol name="checkmark" size={12} color="#fff" weight="bold" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: s.completed ? '#aaa' : '#111',
                  textDecorationLine: s.completed ? 'line-through' : 'none',
                }}
              >
                {s.name}
              </Text>
              {s.feedback ? (
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2, lineHeight: 17 }}>
                  {s.feedback}
                </Text>
              ) : null}
            </View>
            {s.date ? (
              <Text selectable style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
                {s.date}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      {/* ── Contacts ── */}
      {c.contacts.length > 0 && (
        <View
          style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#aaa',
              marginBottom: 6,
            }}
          >
            Contacts
          </Text>
          {c.contacts.map((ct, i) => (
            <View key={i} style={{ paddingVertical: 3 }}>
              <Text style={{ fontSize: 13, fontWeight: '600' }}>{ct.name}</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>
                {ct.role}
                {ct.email ? ` · ${ct.email}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Notes ── */}
      {c.notes ? (
        <View
          style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#aaa',
              marginBottom: 6,
            }}
          >
            Notes
          </Text>
          <Text selectable style={{ fontSize: 13, color: '#666', lineHeight: 19 }}>
            {c.notes}
          </Text>
        </View>
      ) : null}

      {/* ── Footer: dates ── */}
      <View
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f5f5f5',
          flexDirection: 'row',
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconSymbol name="clock" size={11} color="#bbb" />
          <Text selectable style={{ fontSize: 11, color: '#bbb' }}>
            Applied {c.appliedDate || '—'}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: '#bbb' }}>
          Last activity {c.lastActivity || '—'}
        </Text>
      </View>
    </View>
  );
}
