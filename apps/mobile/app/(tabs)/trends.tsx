import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ui/ThemedText';
import { PeriodSelector } from '../../components/charts/PeriodSelector';
import { CalorieTrendChart } from '../../components/charts/CalorieTrendChart';
import { MacroStackChart } from '../../components/charts/MacroStackChart';
import { HealthMetricLineChart } from '../../components/charts/HealthMetricLineChart';
import { useTrendData } from '../../hooks/useTrendData';
import { useGoalStore } from '../../stores/useGoalStore';
import { useHealthMetricTrend } from '../../hooks/useHealthMetricTrend';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function TrendsScreen(): React.JSX.Element {
  const { nutritionTrends, isLoading, period, setPeriod, refresh } = useTrendData();
  const goals = useGoalStore((s) => s.goals);
  const calorieTarget = goals?.calories ?? 2000;

  const stepsTrend = useHealthMetricTrend('steps', period);
  const sleepTrend = useHealthMetricTrend('sleep_minutes', period);
  const hrTrend = useHealthMetricTrend('heart_rate_resting', period);

  const handleRefresh = async (): Promise<void> => {
    await Promise.all([refresh(), stepsTrend.refresh(), sleepTrend.refresh(), hrTrend.refresh()]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.accent.mint}
            colors={[colors.accent.mint]}
          />
        }
      >
        <ThemedText variant="h1">Trends</ThemedText>

        <PeriodSelector selected={period} onSelect={setPeriod} />

        <CalorieTrendChart data={nutritionTrends} calorieTarget={calorieTarget} />

        <MacroStackChart data={nutritionTrends} />

        <HealthMetricLineChart
          title="Steps"
          data={stepsTrend.data}
          unit="steps"
          accentColor={colors.accent.mint}
          emptyMessage="Sync wearable to see step trends"
        />

        <HealthMetricLineChart
          title="Sleep"
          data={sleepTrend.data}
          unit="min"
          accentColor={colors.accent.lavender}
          emptyMessage="Sync wearable to see sleep trends"
        />

        <HealthMetricLineChart
          title="Resting Heart Rate"
          data={hrTrend.data}
          unit="bpm"
          accentColor={colors.accent.cherry}
          emptyMessage="Sync wearable to see heart rate trends"
        />
      </ScrollView>
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
});
