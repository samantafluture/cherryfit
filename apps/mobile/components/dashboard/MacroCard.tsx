import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface MacroCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  accentColor: string;
}

export function MacroCard({
  label,
  current,
  target,
  unit,
  accentColor,
}: MacroCardProps): React.JSX.Element {
  const progress = Math.min(current / Math.max(target, 1), 1);

  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <ThemedText variant="overline" color="secondary">
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText variant="h2" style={{ color: accentColor }}>
          {Math.round(current)}
        </ThemedText>
        <ThemedText variant="caption" color="muted">
          /{Math.round(target)}{unit}
        </ThemedText>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: accentColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
