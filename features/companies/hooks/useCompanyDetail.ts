import { useCompaniesStore } from "@/features/companies/store";
import { useContactForm } from "@/features/companies/hooks/useContactForm";
import { useNoteForm } from "@/features/companies/hooks/useNoteForm";
import { useStageForm } from "@/features/companies/hooks/useStageForm";
import * as companiesApi from "@/services/companies";
import * as contactsApi from "@/services/contacts";
import * as notesApi from "@/services/notes";
import * as stagesApi from "@/services/stages";
import type {
  Company,
  CreateContactPayload,
  CreateNotePayload,
  Stage,
  StageStatus,
  UpdateStagePayload,
} from "@/services/types";
import { impactMedium, notifyWarning } from "@/utils/haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useCompanyDetail(companyId?: string) {
  const router = useRouter();
  const { deleteCompany } = useCompaniesStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [snackError, setSnackError] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<number | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  const contactForm = useContactForm();
  const stageForm = useStageForm();
  const noteForm = useNoteForm();

  const loadCompany = useCallback(async () => {
    if (!companyId) {
      return;
    }

    try {
      setLoading(true);
      const data = await companiesApi.getCompany(Number(companyId));
      setCompany(data);
    } catch {
      setSnackError("Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany]),
  );

  const handleDelete = useCallback(() => {
    notifyWarning();

    const doDelete = async () => {
      try {
        await deleteCompany(Number(companyId));
        router.back();
      } catch {
        setSnackError("Failed to delete company");
      }
    };

    if (process.env.EXPO_OS === "web") {
      if (confirm("Delete this company and all its data?")) {
        void doDelete();
      }
      return;
    }

    Alert.alert("Delete Company", "Delete this company and all its data?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  }, [companyId, deleteCompany, router]);

  const handleStageStatusChange = useCallback(
    async (stage: Stage, status: StageStatus) => {
      try {
        const updated = await stagesApi.updateStage(stage.id, { status });
        setCompany((prev) =>
          prev
            ? {
                ...prev,
                stages: prev.stages?.map((s) => (s.id === updated.id ? updated : s)),
              }
            : prev,
        );
      } catch {
        setSnackError("Failed to update stage status");
      }
    },
    [],
  );

  const handleSaveStage = useCallback(
    async (stageId: number, payload: UpdateStagePayload) => {
      try {
        const updated = await stagesApi.updateStage(stageId, payload);
        setCompany((prev) =>
          prev
            ? {
                ...prev,
                stages: prev.stages?.map((s) => (s.id === updated.id ? updated : s)),
              }
            : prev,
        );
      } catch {
        setSnackError("Failed to save stage");
      }
    },
    [],
  );

  const handleAddContact = useCallback(async () => {
    if (!contactForm.name.trim() || !company) {
      return;
    }

    try {
      const payload: CreateContactPayload = {
        name: contactForm.name.trim(),
        role: contactForm.role.trim(),
        email: contactForm.email.trim(),
      };
      const newContact = await contactsApi.addContact(company.id, payload);
      contactForm.reset();
      setCompany((prev) =>
        prev ? { ...prev, contacts: [...(prev.contacts ?? []), newContact] } : prev,
      );
    } catch {
      setSnackError("Failed to add contact");
    }
  }, [company, contactForm]);

  const handleDeleteContact = useCallback(async (contactId: number) => {
    setDeletingContactId(contactId);
    try {
      await contactsApi.deleteContact(contactId);
      setCompany((prev) =>
        prev
          ? { ...prev, contacts: prev.contacts?.filter((c) => c.id !== contactId) }
          : prev,
      );
    } catch {
      setSnackError("Failed to delete contact");
    } finally {
      setDeletingContactId(null);
    }
  }, []);

  const handleAddStage = useCallback(async () => {
    if (!stageForm.name.trim() || !company) {
      return;
    }

    stageForm.setAdding(true);
    try {
      const newStage = await stagesApi.createStage(company.id, stageForm.name.trim());
      impactMedium();
      stageForm.reset();
      setCompany((prev) =>
        prev ? { ...prev, stages: [...(prev.stages ?? []), newStage] } : prev,
      );
    } catch {
      setSnackError("Failed to add stage");
    } finally {
      stageForm.setAdding(false);
    }
  }, [company, stageForm]);

  const handleDeleteStage = useCallback((stageId: number) => {
    notifyWarning();

    const doDelete = async () => {
      setDeletingStageId(stageId);
      try {
        await stagesApi.deleteStage(stageId);
        setCompany((prev) =>
          prev
            ? { ...prev, stages: prev.stages?.filter((s) => s.id !== stageId) }
            : prev,
        );
      } catch {
        setSnackError("Failed to delete stage");
      } finally {
        setDeletingStageId(null);
      }
    };

    if (process.env.EXPO_OS === "web") {
      if (confirm("Delete this stage?")) {
        void doDelete();
      }
      return;
    }

    Alert.alert("Delete Stage", "Delete this stage?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteForm.content.trim() || !company) {
      return;
    }

    try {
      const payload: CreateNotePayload = { content: noteForm.content.trim() };
      const newNote = await notesApi.addNote(company.id, payload);
      noteForm.reset();
      setCompany((prev) =>
        prev ? { ...prev, notes: [newNote, ...(prev.notes ?? [])] } : prev,
      );
    } catch {
      setSnackError("Failed to add note");
    }
  }, [company, noteForm]);

  const handleDeleteNote = useCallback(async (noteId: number) => {
    setDeletingNoteId(noteId);
    try {
      await notesApi.deleteNote(noteId);
      setCompany((prev) =>
        prev ? { ...prev, notes: prev.notes?.filter((n) => n.id !== noteId) } : prev,
      );
    } catch {
      setSnackError("Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  }, []);

  return {
    company,
    loading,
    expandedStage,
    setExpandedStage,
    snackError,
    setSnackError,
    deletingContactId,
    deletingStageId,
    deletingNoteId,
    contactForm,
    stageForm,
    noteForm,
    handleStageStatusChange,
    handleSaveStage,
    handleAddContact,
    handleDeleteContact,
    handleAddStage,
    handleDeleteStage,
    handleAddNote,
    handleDeleteNote,
    loadCompany,
    handleDelete,
  };
}
