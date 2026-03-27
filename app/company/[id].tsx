import { useLocalSearchParams } from 'expo-router';

import { CompanyForm } from '@/components/company-form';

export default function EditCompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CompanyForm companyId={id} />;
}
