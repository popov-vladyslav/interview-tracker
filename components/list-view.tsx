import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { CompanyCard } from '@/components/company-card';
import { Company } from '@/lib/types';

interface Props {
  companies: Company[];
}

export function ListView({ companies }: Props) {
  const router = useRouter();

  if (companies.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 40 }}>📋</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          No companies yet
        </Text>
        <Text
          style={{ fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', lineHeight: 20 }}
        >
          Start tracking your interview pipeline by adding your first company.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 0 }}>
      {companies.map((item) => (
        <CompanyCard
          key={item.id}
          company={item}
          onEdit={() => router.push(`/company/${item.id}`)}
        />
      ))}
    </View>
  );
}
