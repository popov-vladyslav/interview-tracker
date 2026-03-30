import { CompanyForm } from "@/features/companies/components/company-form";
import { useCompaniesStore } from "@/features/companies/store";
import * as companiesApi from "@/services/companies";
import type { Company, CreateCompanyPayload } from "@/services/types";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function EditCompanyScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateCompany } = useCompaniesStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await companiesApi.getCompany(Number(id));
          setCompany(data);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading || !company) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleSubmit = async (payload: CreateCompanyPayload) => {
    await updateCompany(company.id, payload);
  };

  return (
    <CompanyForm
      submitLabel="Update"
      initialData={company}
      onSubmit={handleSubmit}
    />
  );
}
