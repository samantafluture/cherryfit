import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ThemedText } from '../ui/ThemedText';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { DailyNutritionSummary } from '../../types/database';

interface MacroStackChartProps {
  data: DailyNutritionSummary[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function MacroStackChart({ data }: MacroStackChartProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <Card>
        <ThemedText variant="h2" style={styles.title}>
          Macro Breakdown
        </ThemedText>
        <View style={styles.empty}>
          <ThemedText variant="body" color="muted">
            Log meals to see macro breakdown
          </ThemedText>
        </View>
      </Card>
    );
  }

  const showEveryN = data.length > 14 ? Math.ceil(data.length / 7) : data.length > 7 ? 2 : 1;

  const stackData = data.map((d, i) => ({
    stacks: [
      { value: d.protein_g, color: colors.accent.mint },
      { value: d.carbs_g, color: colors.accent.lavender, marginBottom: 1 },
      { value: d.fat_g, color: colors.accent.yellow, marginBottom: 1 },
    ],
    label: i % showEveryN === 0 ? formatDateLabel(d.date) : '',
  }));

  const maxVal = Math.max(...data.map((d) => d.protein_g + d.carbs_g + d.fat_g));
  const barWidth = data.length <= 7 ? 28 : data.length <= 14 ? 18 : 10;

  return (
    <Card>
      <ThemedText variant="h2" style={styles.title}>
        Macro Breakdown
      </ThemedText>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent.mint }]} />
          <ThemedText variant="caption" color="secondary">
            Protein
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent.lavender }]} />
          <ThemedText variant="caption" color="secondary">
            Carbs
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent.yellow }]} />
          <ThemedText variant="caption" color="secondary">
            Fat
          </ThemedText>
        </View>
      </View>

      <BarChart
        stackData={stackData}
        barWidth={barWidth}
        spacing={data.length <= 7 ? 16 : 8}
        noOfSections={4}
        maxValue={Math.ceil(maxVal * 1.15)}
        yAxisTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        backgroundColor={colors.bg.card}
        isAnimated
        animationDuration={600}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        hideRules
        width={undefined}
        disableScroll={data.length <= 14}
      />
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
});
