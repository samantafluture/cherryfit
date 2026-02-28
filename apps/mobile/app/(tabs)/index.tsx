import { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { CalorieRing } from '../../components/dashboard/CalorieRing';
import { MacroCard } from '../../components/dashboard/MacroCard';
import { SecondaryMacros } from '../../components/dashboard/SecondaryMacros';
import { MealCard } from '../../components/dashboard/MealCard';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { FoodFAB } from '../../components/dashboard/FoodFAB';
import { ThemedText } from '../../components/ui/ThemedText';
import { useFoodStore } from '../../stores/useFoodStore';
import { useGoalStore } from '../../stores/useGoalStore';
import { calculateDailyTotals } from '../../utils/macros';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function HomeScreen(): React.JSX.Element {
  const todayLogs = useFoodStore((s) => s.todayLogs);
  const removeLog = useFoodStore((s) => s.removeLog);
  const goals = useGoalStore((s) => s.goals);

  const handleDeleteLog = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete Entry', `Remove "${name}" from today's log?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void removeLog(id),
        },
      ]);
    },
    [removeLog],
  );

  const totals = calculateDailyTotals(todayLogs);

  const calorieTarget = goals?.calories ?? 2000;
  const proteinTarget = goals?.protein_g ?? 150;
  const carbsTarget = goals?.carbs_g ?? 200;
  const fatTarget = goals?.fat_g ?? 67;
  const fiberTarget = goals?.fiber_g ?? 30;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />

        <CalorieRing current={totals.calories} target={calorieTarget} />

        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            current={totals.protein_g}
            target={proteinTarget}
            unit="g"
            accentColor={colors.accent.mint}
          />
          <MacroCard
            label="Carbs"
            current={totals.carbs_g}
            target={carbsTarget}
            unit="g"
            accentColor={colors.accent.lavender}
          />
          <MacroCard
            label="Fat"
            current={totals.fat_g}
            target={fatTarget}
            unit="g"
            accentColor={colors.accent.yellow}
          />
          <MacroCard
            label="Fiber"
            current={totals.fiber_g}
            target={fiberTarget}
            unit="g"
            accentColor={colors.text.muted}
          />
        </View>

        <SecondaryMacros
          sugar={{
            current: totals.sugar_g,
            target: goals?.sugar_g ?? null,
          }}
          sodium={{
            current: totals.sodium_mg,
            target: goals?.sodium_mg ?? null,
          }}
        />

        <View style={styles.mealsSection}>
          <ThemedText variant="h2">Today&apos;s Meals</ThemedText>
          {todayLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.mealsList}>
              {todayLogs.map((log) => (
                <MealCard
                  key={log.id}
                  log={log}
                  onPress={() => {
                    // TODO: Navigate to edit screen
                  }}
                  onLongPress={() =>
                    handleDeleteLog(log.id, log.food_name)
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <FoodFAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealsSection: {
    gap: spacing.sm,
  },
  mealsList: {
    gap: spacing.sm,
  },
});
