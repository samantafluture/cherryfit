import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface SecondaryMacrosProps {
  sugar: { current: number; target: number | null };
  sodium: { current: number; target: number | null };
}

function SecondaryItem({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number | null;
  unit: string;
}): React.JSX.Element {
  return (
    <View style={styles.item}>
      <ThemedText variant="caption" color="secondary">
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText variant="caption" color="primary">
          {Math.round(current)}
        </ThemedText>
        {target != null && (
          <ThemedText variant="caption" color="muted">
            /{Math.round(target)}{unit}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function SecondaryMacros({
  sugar,
  sodium,
}: SecondaryMacrosProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <SecondaryItem label="Sugar" current={sugar.current} target={sugar.target} unit="g" />
      <View style={styles.divider} />
      <SecondaryItem label="Sodium" current={sodium.current} target={sodium.target} unit="mg" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
});
