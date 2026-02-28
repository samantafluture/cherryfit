import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ThemedText } from '../ui/ThemedText';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { DailyNutritionSummary } from '../../types/database';

interface CalorieTrendChartProps {
  data: DailyNutritionSummary[];
  calorieTarget: number;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function CalorieTrendChart({
  data,
  calorieTarget,
}: CalorieTrendChartProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <Card>
        <ThemedText variant="h2" style={styles.title}>
          Calorie Trend
        </ThemedText>
        <View style={styles.empty}>
          <ThemedText variant="body" color="muted">
            Log meals to see calorie trends
          </ThemedText>
        </View>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.calories), calorieTarget);
  const showEveryN = data.length > 14 ? Math.ceil(data.length / 7) : data.length > 7 ? 2 : 1;

  const barData = data.map((d, i) => ({
    value: d.calories,
    label: i % showEveryN === 0 ? formatDateLabel(d.date) : '',
    frontColor: d.calories > calorieTarget ? colors.accent.cherry : colors.accent.mint,
    topLabelComponent: () =>
      data.length <= 14 ? (
        <ThemedText variant="caption" color="secondary" style={styles.barLabel}>
          {d.calories}
        </ThemedText>
      ) : null,
  }));

  const barWidth = data.length <= 7 ? 28 : data.length <= 14 ? 18 : 10;

  return (
    <Card>
      <ThemedText variant="h2" style={styles.title}>
        Calorie Trend
      </ThemedText>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent.mint }]} />
          <ThemedText variant="caption" color="secondary">
            Under target
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent.cherry }]} />
          <ThemedText variant="caption" color="secondary">
            Over target
          </ThemedText>
        </View>
      </View>

      <BarChart
        data={barData}
        barWidth={barWidth}
        spacing={data.length <= 7 ? 16 : 8}
        noOfSections={4}
        maxValue={Math.ceil(maxVal * 1.15)}
        yAxisTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        backgroundColor={colors.bg.card}
        showReferenceLine1
        referenceLine1Position={calorieTarget}
        referenceLine1Config={{
          color: colors.accent.yellow,
          dashWidth: 6,
          dashGap: 4,
          thickness: 1.5,
        }}
        isAnimated
        animationDuration={600}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        hideRules
        width={undefined}
        disableScroll={data.length <= 14}
      />

      <View style={styles.targetLabel}>
        <View style={[styles.legendDot, { backgroundColor: colors.accent.yellow }]} />
        <ThemedText variant="caption" color="secondary">
          Target: {calorieTarget} kcal
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.sm,
  },
  empty: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  targetLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  barLabel: {
    fontSize: 9,
    marginBottom: 2,
  },
});
