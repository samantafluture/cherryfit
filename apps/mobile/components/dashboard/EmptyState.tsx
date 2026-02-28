import { View, StyleSheet } from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function EmptyState(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <UtensilsCrossed size={48} color={colors.text.muted} strokeWidth={1.5} />
      <ThemedText variant="h2" color="secondary" style={styles.title}>
        Your plate is empty!
      </ThemedText>
      <ThemedText variant="body" color="muted" style={styles.subtitle}>
        Tap + to start logging your meals
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.md,
  },
  subtitle: {
    textAlign: 'center',
  },
});
