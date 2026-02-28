import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import type { TrendPeriod } from '../../hooks/useTrendData';

interface PeriodSelectorProps {
  selected: TrendPeriod;
  onSelect: (period: TrendPeriod) => void;
}

const periods: { value: TrendPeriod; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export function PeriodSelector({ selected, onSelect }: PeriodSelectorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {periods.map((p) => (
        <Pressable
          key={p.value}
          style={[styles.pill, selected === p.value && styles.pillActive]}
          onPress={() => onSelect(p.value)}
        >
          <ThemedText
            variant="caption"
            color={selected === p.value ? 'primary' : 'muted'}
            style={selected === p.value ? styles.activeText : undefined}
          >
            {p.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'center',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accent.mint + '20',
    borderColor: colors.accent.mint,
  },
  activeText: {
    color: colors.accent.mint,
  },
});
