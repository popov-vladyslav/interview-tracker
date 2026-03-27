import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BoardView } from '@/components/board-view';
import { ListView } from '@/components/list-view';
import { StatsBar } from '@/components/stats-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCompanies } from '@/lib/companies-context';
import { STATUSES, STATUS_COLORS } from '@/lib/types';

type ViewMode = 'list' | 'board';

export default function TrackerScreen() {
  const router = useRouter();
  const { companies, loading, syncing, error, clearError, loadFromNotion } = useCompanies();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    loadFromNotion();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = companies.filter((c) => c.status === 'Active').length;
  const subtitle =
    companies.length === 0
      ? 'No companies tracked'
      : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} tracked${activeCount > 0 ? ` · ${activeCount} active` : ''}`;

  function handleAdd() {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/company/add');
  }

  function handleRefresh() {
    if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
    loadFromNotion();
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" />
          <Text style={{ fontSize: 14, color: '#888' }}>Loading from Notion…</Text>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardDismissMode="on-drag"
        >
          {/* ── Page header ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 56,
              paddingBottom: 4,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                Interview Tracker
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 14, color: '#888' }}>{subtitle}</Text>
                {syncing && <ActivityIndicator size="small" />}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <Pressable
                onPress={handleRefresh}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <IconSymbol name="arrow.clockwise" size={20} color="#888" />
              </Pressable>

              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 24,
                  borderCurve: 'continuous',
                  backgroundColor: pressed ? '#333' : '#111',
                })}
              >
                <IconSymbol name="plus" size={14} color="#fff" weight="semibold" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  Add Company
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Error banner ── */}
          {error && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginHorizontal: 20,
                marginTop: 12,
                padding: 12,
                backgroundColor: '#FFEBEE',
                borderRadius: 10,
                borderCurve: 'continuous',
              }}
            >
              <Text style={{ fontSize: 13, color: '#C62828', flex: 1 }}>{error}</Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <IconSymbol name="xmark" size={14} color="#C62828" />
              </Pressable>
            </View>
          )}

          {/* ── Stats grid ── */}
          <View style={{ paddingTop: 20 }}>
            <StatsBar companies={companies} />
          </View>

          {/* ── Search ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: 12,
              borderCurve: 'continuous',
              paddingHorizontal: 12,
              paddingVertical: 9,
            }}
          >
            <IconSymbol name="magnifyingglass" size={16} color="#999" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search companies or roles…"
              placeholderTextColor="#aaa"
              style={{ flex: 1, fontSize: 14 }}
              clearButtonMode="while-editing"
            />
          </View>

          {/* ── Filter chips + view toggle ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              paddingLeft: 20,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              style={{ flex: 1 }}
            >
              {['All', ...STATUSES].map((s) => {
                const active = filterStatus === s;
                const dot =
                  s !== 'All'
                    ? STATUS_COLORS[s as keyof typeof STATUS_COLORS]?.dot
                    : undefined;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                      setFilterStatus(s);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: active ? '#222' : '#e0e0e0',
                      backgroundColor: active ? '#222' : 'transparent',
                    }}
                  >
                    {dot && (
                      <View
                        style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: active ? '600' : '400',
                        color: active ? '#fff' : '#555',
                      }}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Board / List toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: 9,
                padding: 2,
                marginRight: 20,
              }}
            >
              {(['list', 'board'] as ViewMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                    setViewMode(m);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 7,
                    backgroundColor: viewMode === m ? '#fff' : 'transparent',
                    boxShadow: viewMode === m ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: viewMode === m ? '#222' : '#888',
                    }}
                  >
                    {m === 'list' ? 'List' : 'Board'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Content ── */}
          <View style={{ marginTop: 16 }}>
            {viewMode === 'list' ? (
              <ListView companies={filtered} />
            ) : (
              <BoardView companies={filtered} />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
