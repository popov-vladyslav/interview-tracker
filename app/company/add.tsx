import { CompanyForm } from "@/features/companies/components/company-form";
import { useCompaniesStore } from "@/features/companies/store";
import type { CreateCompanyPayload } from "@/services/types";

export default function AddCompanyScreen() {
  const { createCompany } = useCompaniesStore();

  const handleSubmit = async (payload: CreateCompanyPayload) => {
    await createCompany(payload);
  };

  return <CompanyForm submitLabel="Save" onSubmit={handleSubmit} />;
}
