import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '../ui/ThemedText';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface DataPoint {
  date: string;
  value: number;
}

interface HealthMetricLineChartProps {
  title: string;
  data: DataPoint[];
  unit: string;
  accentColor: string;
  emptyMessage?: string;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function HealthMetricLineChart({
  title,
  data,
  unit,
  accentColor,
  emptyMessage = 'No data yet',
}: HealthMetricLineChartProps): React.JSX.Element {
  if (data.length === 0) {
    return (
      <Card>
        <ThemedText variant="h2" style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.empty}>
          <ThemedText variant="body" color="muted">
            {emptyMessage}
          </ThemedText>
        </View>
      </Card>
    );
  }

  const showEveryN = data.length > 14 ? Math.ceil(data.length / 7) : data.length > 7 ? 2 : 1;

  const lineData = data.map((d, i) => ({
    value: d.value,
    label: i % showEveryN === 0 ? formatDateLabel(d.date) : '',
    dataPointText: data.length <= 14 ? String(Math.round(d.value)) : undefined,
  }));

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.15 || maxVal * 0.15;

  return (
    <Card>
      <ThemedText variant="h2" style={styles.title}>
        {title}
      </ThemedText>

      <View style={styles.summary}>
        <ThemedText variant="caption" color="secondary">
          Latest:{' '}
        </ThemedText>
        <ThemedText variant="h2" style={{ color: accentColor }}>
          {Math.round(data[data.length - 1]!.value)}{' '}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {unit}
        </ThemedText>
      </View>

      <LineChart
        data={lineData}
        color={accentColor}
        dataPointsColor={accentColor}
        thickness={2}
        noOfSections={4}
        maxValue={Math.ceil(maxVal + padding)}
        yAxisOffset={Math.floor(Math.max(0, minVal - padding))}
        yAxisTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.text.muted, fontSize: 10 }}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        backgroundColor={colors.bg.card}
        isAnimated
        animationDuration={600}
        curved
        hideRules
        dataPointsRadius={3}
        width={undefined}
        disableScroll={data.length <= 14}
        textColor={colors.text.secondary}
        textFontSize={9}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.xs,
  },
  empty: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
});
