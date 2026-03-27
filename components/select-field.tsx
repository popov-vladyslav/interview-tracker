import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

interface Props {
  label: string;
  value: string;
  options: readonly string[] | string[];
  onChange: (v: string) => void;
  dotColors?: Record<string, string>;
}

export function SelectField({ label, value, options, onChange, dotColors }: Props) {
  const [open, setOpen] = useState(false);

  function toggle() {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    setOpen((o) => !o);
  }

  function select(opt: string) {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    onChange(opt);
    setOpen(false);
  }

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

      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          borderWidth: 1.5,
          borderColor: open ? '#333' : '#e0e0e0',
          borderRadius: 10,
          borderCurve: 'continuous',
          backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent',
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {dotColors?.[value] && (
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColors[value] }}
            />
          )}
          <Text style={{ fontSize: 14, color: '#111', fontWeight: '500' }}>{value}</Text>
        </View>
        <IconSymbol
          name={open ? 'chevron.up' : 'chevron.down'}
          size={14}
          color="#999"
        />
      </Pressable>

      {open && (
        <View
          style={{
            borderWidth: 1.5,
            borderColor: '#e0e0e0',
            borderRadius: 10,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => select(opt)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: pressed
                    ? 'rgba(0,0,0,0.04)'
                    : opt === value
                      ? 'rgba(0,0,0,0.02)'
                      : 'transparent',
                })}
              >
                {dotColors?.[opt] && (
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColors[opt] }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 14,
                    color: '#111',
                    fontWeight: opt === value ? '600' : '400',
                    flex: 1,
                  }}
                >
                  {opt}
                </Text>
                {opt === value && (
                  <IconSymbol name="checkmark" size={14} color="#43A047" weight="semibold" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
