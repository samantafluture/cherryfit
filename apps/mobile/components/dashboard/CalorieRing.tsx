import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '../ui/ThemedText';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CalorieRingProps {
  current: number;
  target: number;
  size?: number;
}

export function CalorieRing({
  current,
  target,
  size = 200,
}: CalorieRingProps): React.JSX.Element {
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(current / Math.max(target, 1), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(target - current, 0);
  const isOver = current > target;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={isOver ? colors.accent.cherry : colors.accent.mint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerText}>
        <ThemedText variant="display" color={isOver ? 'cherry' : 'primary'}>
          {Math.round(current)}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {isOver ? `${Math.round(current - target)} over` : `${Math.round(remaining)} left`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
