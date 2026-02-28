import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Target, ChevronRight, Activity, RefreshCw, Unlink } from 'lucide-react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { Card } from '../../components/ui/Card';
import { useHealthConnect } from '../../hooks/useHealthConnect';
import { useFitbitSync } from '../../hooks/useFitbitSync';
import { trpcClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const hc = useHealthConnect();
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [fitbitConfigured, setFitbitConfigured] = useState(false);
  const fitbitSync = useFitbitSync(fitbitConnected);

  useEffect(() => {
    async function checkFitbit(): Promise<void> {
      try {
        const status = await trpcClient.health.getFitbitStatus.query();
        setFitbitConfigured(status.configured);
        setFitbitConnected(status.connected);
      } catch {
        // Backend not reachable — skip
      }
    }
    void checkFitbit();
  }, []);

  const handleConnectFitbit = async (): Promise<void> => {
    try {
      const result = await trpcClient.health.getFitbitAuthUrl.query();
      if (result.url) {
        await Linking.openURL(result.url);
      }
    } catch (err) {
      console.error('Failed to get Fitbit auth URL:', err);
    }
  };

  const handleDisconnectFitbit = (): void => {
    Alert.alert('Disconnect Fitbit', 'Stop syncing food logs to Fitbit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await trpcClient.health.disconnectFitbit.mutate();
            setFitbitConnected(false);
          } catch (err) {
            console.error('Failed to disconnect Fitbit:', err);
          }
        },
      },
    ]);
  };

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

        <ThemedText variant="h2">Integrations</ThemedText>

        {/* Health Connect */}
        <Card>
          <View style={styles.section}>
            <View style={styles.menuItem}>
              <Activity size={22} color={colors.accent.lavender} strokeWidth={1.5} />
              <View style={styles.menuItemText}>
                <ThemedText variant="body">Health Connect</ThemedText>
                <ThemedText variant="caption" color="secondary">
                  {hc.isAvailable
                    ? hc.hasPermissions
                      ? 'Connected'
                      : 'Available — tap to connect'
                    : 'Requires dev build'}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: hc.isAvailable && hc.hasPermissions
                      ? colors.accent.mint
                      : hc.isAvailable
                        ? colors.accent.yellow
                        : colors.text.muted,
                  },
                ]}
              />
            </View>

            {hc.isAvailable && !hc.hasPermissions && (
              <Pressable
                style={({ pressed }) => [styles.connectButton, pressed && styles.buttonPressed]}
                onPress={() => void hc.requestPermissions()}
              >
                <ThemedText variant="body" color="mint">
                  Grant Permissions
                </ThemedText>
              </Pressable>
            )}

            {hc.isAvailable && hc.hasPermissions && (
              <View style={styles.syncRow}>
                <ThemedText variant="caption" color="secondary">
                  Last synced: {hc.lastSynced ? formatTime(hc.lastSynced) : 'Never'}
                </ThemedText>
                <Pressable
                  onPress={() => void hc.syncNow()}
                  disabled={hc.isSyncing}
                  hitSlop={12}
                >
                  {hc.isSyncing ? (
                    <ActivityIndicator size="small" color={colors.accent.mint} />
                  ) : (
                    <RefreshCw size={18} color={colors.accent.mint} strokeWidth={1.5} />
                  )}
                </Pressable>
              </View>
            )}

            {!hc.isAvailable && (
              <ThemedText variant="caption" color="muted" style={styles.note}>
                Health Connect requires a dev build (not available in Expo Go).
              </ThemedText>
            )}
          </View>
        </Card>

        {/* Fitbit */}
        <Card>
          <View style={styles.section}>
            <View style={styles.menuItem}>
              <View style={[styles.fitbitIcon]}>
                <ThemedText variant="caption" style={styles.fitbitIconText}>
                  Fb
                </ThemedText>
              </View>
              <View style={styles.menuItemText}>
                <ThemedText variant="body">Fitbit</ThemedText>
                <ThemedText variant="caption" color="secondary">
                  {fitbitConnected
                    ? 'Connected — syncing food logs'
                    : fitbitConfigured
                      ? 'Tap to connect'
                      : 'Not configured'}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: fitbitConnected
                      ? colors.accent.mint
                      : fitbitConfigured
                        ? colors.accent.yellow
                        : colors.text.muted,
                  },
                ]}
              />
            </View>

            {fitbitConfigured && !fitbitConnected && (
              <Pressable
                style={({ pressed }) => [styles.connectButton, pressed && styles.buttonPressed]}
                onPress={() => void handleConnectFitbit()}
              >
                <ThemedText variant="body" color="mint">
                  Connect Fitbit
                </ThemedText>
              </Pressable>
            )}

            {fitbitConnected && (
              <>
                <View style={styles.syncRow}>
                  <ThemedText variant="caption" color="secondary">
                    {fitbitSync.isSyncing
                      ? 'Syncing...'
                      : fitbitSync.lastSynced
                        ? `Last synced: ${formatTime(fitbitSync.lastSynced)}`
                        : 'Auto-sync every 5 min'}
                  </ThemedText>
                  <Pressable onPress={handleDisconnectFitbit} hitSlop={12}>
                    <Unlink size={18} color={colors.accent.cherry} strokeWidth={1.5} />
                  </Pressable>
                </View>
                {fitbitSync.lastResult && fitbitSync.lastResult.synced > 0 && (
                  <ThemedText variant="caption" color="mint">
                    {fitbitSync.lastResult.synced} logs synced to Fitbit
                  </ThemedText>
                )}
              </>
            )}

            {!fitbitConfigured && (
              <ThemedText variant="caption" color="muted" style={styles.note}>
                Set FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET in backend .env to enable.
              </ThemedText>
            )}
          </View>
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
    paddingBottom: spacing.xl * 2,
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
  section: {
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectButton: {
    backgroundColor: colors.accent.mint + '15',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.mint + '30',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  note: {
    paddingTop: spacing.xs,
    lineHeight: 18,
  },
  fitbitIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#00B0B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitbitIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
