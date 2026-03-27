import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { CompanyCard } from '@/components/company-card';
import { Company, STATUSES, STATUS_COLORS } from '@/lib/types';

interface Props {
  companies: Company[];
}

export function BoardView({ companies }: Props) {
  const router = useRouter();

  const grouped = STATUSES.reduce<Record<string, Company[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {},
  );
  companies.forEach((c) => {
    if (grouped[c.status]) grouped[c.status].push(c);
  });

  const activeCols = STATUSES.filter((s) => grouped[s].length > 0);

  if (activeCols.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 40 }}>📋</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          No companies yet
        </Text>
        <Text
          style={{ fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', lineHeight: 20 }}
        >
          Add your first company to start tracking.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
    >
      {activeCols.map((status) => {
        const sc = STATUS_COLORS[status];
        return (
          <View key={status} style={{ width: 300 }}>
            {/* Column header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingHorizontal: 2,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sc.dot }} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {status}
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 11, color: '#888' }}>{grouped[status].length}</Text>
              </View>
            </View>

            {grouped[status].map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                onEdit={() => router.push(`/company/${c.id}`)}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
