import KanbanBoard from "@/components/kanban-board";
import { EmptyState } from "@/features/common/components/empty-state";
import { CompanyCard } from "@/features/companies/components/company-card";
import { DashboardToolbar } from "@/features/companies/components/dashboard-toolbar";
import { StatsBar } from "@/features/companies/components/stats-bar";
import { useCompaniesStore } from "@/features/companies/store";
import type { Company } from "@/services/types";
import { STATUSES } from "@/services/types";
import { spacing, STATUS_COLORS } from "@/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { FAB, Searchbar, Snackbar, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const isWeb = process.env.EXPO_OS === "web";
const KANBAN_MIN_WIDTH = 768;

// ── Skeleton Card ──

function SkeletonCard() {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      style={[skeletonStyles.card, { backgroundColor: theme.colors.surface }]}
    >
      <Animated.View style={animStyle}>
        <View
          style={[
            skeletonStyles.line,
            skeletonStyles.titleLine,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        />
        <View
          style={[
            skeletonStyles.line,
            skeletonStyles.subtitleLine,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        />
        <View style={skeletonStyles.chipRow}>
          <View
            style={[
              skeletonStyles.chip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          />
          <View
            style={[
              skeletonStyles.chip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          />
        </View>
        <View
          style={[
            skeletonStyles.line,
            skeletonStyles.footerLine,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: spacing.md,
    elevation: 1,
  },
  line: {
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  titleLine: {
    width: "50%",
    height: 18,
  },
  subtitleLine: {
    width: "70%",
    height: 14,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  footerLine: {
    width: "40%",
    height: 12,
  },
});

// ── Dashboard Screen ──

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    companies,
    isLoading,
    isRefreshing,
    error,
    fetchCompanies,
    refreshCompanies,
    updateCompanyStatus,
    clearError,
  } = useCompaniesStore();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const showKanban = isWeb && width >= KANBAN_MIN_WIDTH;

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, []),
  );

  const filtered = useMemo(() => {
    let result = companies;
    if (stageFilter) {
      result = result.filter((c) => c.stage === stageFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
      );
    }
    return result;
  }, [companies, stageFilter, search]);

  const statusColumns = useMemo(() => [...STATUSES], []);

  const kanbanCompanies = useMemo(
    () =>
      filtered.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        status: c.status,
        stage: c.stage,
        salary: c.salary,
      })),
    [filtered],
  );

  const handleStatusChange = useCallback(
    (companyId: number, newStatus: string) => {
      updateCompanyStatus(companyId, newStatus);
    },
    [updateCompanyStatus],
  );

  const handleCardPress = useCallback(
    (companyId: number) => {
      router.push(`/company/${companyId}`);
    },
    [router],
  );

  const handleCardEdit = useCallback(
    (companyId: number) => {
      router.push(`/company/${companyId}/edit`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Company }) => <CompanyCard company={item} />,
    [],
  );

  const showEmpty = !isLoading && companies.length === 0;
  const showSkeleton = isLoading && companies.length === 0;
  const hasFilters = !!search || !!stageFilter;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, showKanban && styles.kanbanContent]}>
        {/* Toolbar / Filters */}
        {showKanban ? (
          <View style={styles.webToolbar}>
            <Searchbar
              placeholder="Search companies or roles..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              elevation={0}
            />
            <StatsBar
              companies={companies}
              selectedStage={stageFilter}
              onSelect={setStageFilter}
            />
          </View>
        ) : isWeb ? (
          <View style={styles.webListContent}>
            <View style={styles.searchRow}>
              <Searchbar
                placeholder="Search companies or roles..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
                elevation={0}
              />
            </View>
            <StatsBar
              companies={companies}
              selectedStage={stageFilter}
              onSelect={setStageFilter}
            />
          </View>
        ) : (
          <DashboardToolbar
            companies={companies}
            search={search}
            onSearchChange={setSearch}
            selectedStage={stageFilter}
            onStageSelect={setStageFilter}
          />
        )}

        {/* Main Content */}
        {showSkeleton ? (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : showKanban ? (
          <View style={styles.kanbanWrapper}>
            <KanbanBoard
              companies={kanbanCompanies}
              statusColumns={statusColumns}
              statusColors={STATUS_COLORS}
              onStatusChange={handleStatusChange}
              onCardPress={handleCardPress}
              onCardEdit={handleCardEdit}
            />
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={
              filtered.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshCompanies}
              />
            }
            ListEmptyComponent={
              showEmpty ? (
                <EmptyState
                  icon="briefcase-outline"
                  title={hasFilters ? "No matches" : "No interviews yet"}
                  description={
                    hasFilters
                      ? "Try adjusting your search or filters"
                      : "Tap + to add your first interview"
                  }
                  actionLabel={!hasFilters ? "Add Interview" : undefined}
                  onAction={
                    !hasFilters ? () => router.push("/company/add") : undefined
                  }
                />
              ) : null
            }
          />
        )}
      </View>

      {showEmpty && !isWeb ? null : (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary },
            isWeb && styles.fabWeb,
          ]}
          color={theme.colors.onPrimary}
          onPress={() => router.push("/company/add")}
        />
      )}

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{ label: "Retry", onPress: fetchCompanies }}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  kanbanContent: {
    width: "100%",
  },
  webListContent: {
    maxWidth: 960,
    alignSelf: "center",
    width: "100%",
  },
  webToolbar: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  searchRow: {
    paddingHorizontal: spacing.md,
  },
  searchbar: {
    borderRadius: 12,
    maxWidth: 400,
  },
  searchInput: {
    fontSize: 14,
  },
  kanbanWrapper: {
    flex: 1,
    marginTop: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 16,
  },
  fabWeb: {
    right: spacing.xl,
    bottom: spacing.xl,
  },
});
