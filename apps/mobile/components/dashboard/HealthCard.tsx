import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface HealthCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
  accentColor: string;
}

export function HealthCard({
  icon,
  label,
  value,
  unit,
  accentColor,
}: HealthCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
        {icon}
      </View>
      <ThemedText variant="caption" color="secondary" style={styles.label}>
        {label}
      </ThemedText>
      {value != null ? (
        <View style={styles.valueRow}>
          <ThemedText variant="h2" style={{ color: accentColor }}>
            {value.toLocaleString()}
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            {' '}
            {unit}
          </ThemedText>
        </View>
      ) : (
        <ThemedText variant="body" color="muted" style={styles.noData}>
          --
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  noData: {
    fontSize: 24,
  },
});
