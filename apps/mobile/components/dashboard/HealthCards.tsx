import { ScrollView, StyleSheet } from 'react-native';
import { Footprints, Moon, Heart, Timer } from 'lucide-react-native';
import { HealthCard } from './HealthCard';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function HealthCards(): React.JSX.Element {
  const metrics = useHealthStore((s) => s.metrics);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <HealthCard
        icon={<Footprints size={20} color={colors.accent.mint} strokeWidth={1.5} />}
        label="Steps"
        value={metrics.steps}
        unit="steps"
        accentColor={colors.accent.mint}
      />
      <HealthCard
        icon={<Moon size={20} color={colors.accent.lavender} strokeWidth={1.5} />}
        label="Sleep"
        value={metrics.sleepMinutes != null ? Math.round(metrics.sleepMinutes / 60 * 10) / 10 : null}
        unit="hrs"
        accentColor={colors.accent.lavender}
      />
      <HealthCard
        icon={<Heart size={20} color={colors.accent.cherry} strokeWidth={1.5} />}
        label="Heart Rate"
        value={metrics.restingHr}
        unit="bpm"
        accentColor={colors.accent.cherry}
      />
      <HealthCard
        icon={<Timer size={20} color={colors.accent.yellow} strokeWidth={1.5} />}
        label="Active"
        value={metrics.activeMinutes}
        unit="min"
        accentColor={colors.accent.yellow}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
