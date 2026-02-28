import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { spacing } from '../../theme/spacing';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardHeader(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ThemedText variant="h1">{getGreeting()}, Sam</ThemedText>
      <ThemedText variant="caption" color="secondary">
        {formatDate(new Date())}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
