import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import type { LocalFoodLog } from '../../types/database';

interface MealCardProps {
  log: LocalFoodLog;
  onPress: () => void;
  onLongPress?: () => void;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function MealCard({ log, onPress, onLongPress }: MealCardProps): React.JSX.Element {
  const totalCal = Math.round(log.calories * log.servings);
  const totalProtein = Math.round(log.protein_g * log.servings);
  const totalCarbs = Math.round(log.carbs_g * log.servings);
  const totalFat = Math.round(log.fat_g * log.servings);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.mealBadge}>
          <ThemedText variant="overline" color="primary" style={styles.badgeText}>
            {mealTypeLabels[log.meal_type] ?? log.meal_type}
          </ThemedText>
        </View>
        <ThemedText variant="caption" color="muted">
          {log.servings !== 1 ? `${log.servings}x ` : ''}
          {log.serving_size}
        </ThemedText>
      </View>
      <ThemedText variant="body" numberOfLines={1}>
        {log.food_name}
      </ThemedText>
      <View style={styles.macroRow}>
        <ThemedText variant="h2" color="mint">
          {totalCal}
        </ThemedText>
        <ThemedText variant="caption" color="secondary"> cal</ThemedText>
        <View style={styles.macroSpacer} />
        <ThemedText variant="caption" color="secondary">
          P {totalProtein}g
        </ThemedText>
        <ThemedText variant="caption" color="muted"> · </ThemedText>
        <ThemedText variant="caption" color="secondary">
          C {totalCarbs}g
        </ThemedText>
        <ThemedText variant="caption" color="muted"> · </ThemedText>
        <ThemedText variant="caption" color="secondary">
          F {totalFat}g
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealBadge: {
    backgroundColor: colors.accent.yellow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.bg.primary,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroSpacer: {
    flex: 1,
  },
});
