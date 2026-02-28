import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function FoodLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    />
  );
}
