import { Text, View } from 'react-native';

import { Company } from '@/lib/types';

interface Props {
  companies: Company[];
}

export function StatsBar({ companies }: Props) {
  if (companies.length === 0) return null;

  const active = companies.filter((c) => c.status === 'Active').length;
  const offers = companies.filter((c) => c.status === 'Offer' || c.status === 'Accepted').length;
  const rejected = companies.filter((c) => c.status === 'Rejected').length;
  const withdrawn = companies.filter((c) => c.status === 'Withdrawn').length;
  const successPct = Math.round((offers / companies.length) * 100);

  const stats = [
    { label: 'Total', value: companies.length },
    { label: 'Active', value: active },
    { label: 'Offers', value: offers },
    { label: 'Rejected', value: rejected },
    { label: 'Withdrawn', value: withdrawn },
    { label: 'Success', value: `${successPct}%` },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 20,
      }}
    >
      {stats.map(({ label, value }) => (
        <View
          key={label}
          style={{
            alignItems: 'center',
            paddingVertical: 14,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(0,0,0,0.04)',
            // 3 per row: (100% - 2 gaps) / 3
            flexBasis: '30%',
            flexGrow: 1,
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 22,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
            }}
          >
            {value}
          </Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
