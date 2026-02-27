import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Providers } from '../services/providers';

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded]);

  if (!appReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent.mint} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
        }}
      />
      <StatusBar style="light" />
    </Providers>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
});
