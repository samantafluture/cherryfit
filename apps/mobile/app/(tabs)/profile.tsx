import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Target, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="h1">Settings &amp; Data</ThemedText>

        <Card>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/goals')}
          >
            <Target size={22} color={colors.accent.mint} strokeWidth={1.5} />
            <View style={styles.menuItemText}>
              <ThemedText variant="body">Daily Goals</ThemedText>
              <ThemedText variant="caption" color="secondary">
                Set calorie and macro targets
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.text.muted} strokeWidth={1.5} />
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
});
