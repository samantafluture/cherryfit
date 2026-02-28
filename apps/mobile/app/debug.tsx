import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Smartphone,
  Camera,
  Activity,
  Wifi,
} from 'lucide-react-native';
import { ThemedText } from '../components/ui/ThemedText';
import { Card } from '../components/ui/Card';
import { getConfiguredApiUrl } from '../services/api';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

type TestStatus = 'idle' | 'running' | 'pass' | 'warn' | 'fail';

interface TestResult {
  status: TestStatus;
  message: string;
}

const STATUS_COLORS: Record<TestStatus, string> = {
  idle: colors.text.muted,
  running: colors.accent.lavender,
  pass: colors.accent.mint,
  warn: colors.accent.yellow,
  fail: colors.accent.cherry,
};

function StatusIcon({ status }: { status: TestStatus }): React.JSX.Element {
  const color = STATUS_COLORS[status];
  if (status === 'running') return <ActivityIndicator size={18} color={color} />;
  if (status === 'pass') return <CheckCircle size={18} color={color} strokeWidth={1.5} />;
  if (status === 'warn') return <AlertTriangle size={18} color={color} strokeWidth={1.5} />;
  if (status === 'fail') return <XCircle size={18} color={color} strokeWidth={1.5} />;
  return <View style={[styles.idleDot, { backgroundColor: color }]} />;
}

export default function DebugScreen(): React.JSX.Element {
  const router = useRouter();

  const [cameraResult, setCameraResult] = useState<TestResult>({
    status: 'idle',
    message: 'Not tested',
  });
  const [hcResult, setHcResult] = useState<TestResult>({
    status: 'idle',
    message: 'Not tested',
  });
  const [backendResult, setBackendResult] = useState<TestResult>({
    status: 'idle',
    message: 'Not tested',
  });

  const testCamera = useCallback(async () => {
    setCameraResult({ status: 'running', message: 'Checking permissions...' });
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setCameraResult({ status: 'pass', message: 'Camera permission granted' });
      } else {
        setCameraResult({ status: 'warn', message: `Permission status: ${status}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setCameraResult({ status: 'fail', message: msg });
    }
  }, []);

  const testHealthConnect = useCallback(async () => {
    setHcResult({ status: 'running', message: 'Checking Health Connect...' });

    if (Platform.OS !== 'android') {
      setHcResult({ status: 'warn', message: 'Health Connect is Android-only' });
      return;
    }

    if (Constants.appOwnership === 'expo') {
      setHcResult({ status: 'warn', message: 'Not available in Expo Go — use dev build' });
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const hc = require('../services/healthConnect') as {
        isHealthConnectAvailable: () => Promise<boolean>;
        initializeHealthConnect: () => Promise<boolean>;
      };
      const available = await hc.isHealthConnectAvailable();
      if (!available) {
        setHcResult({ status: 'warn', message: 'SDK not available on this device' });
        return;
      }
      const inited = await hc.initializeHealthConnect();
      setHcResult({
        status: inited ? 'pass' : 'warn',
        message: inited ? 'Available and initialized' : 'Available but init returned false',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setHcResult({ status: 'fail', message: msg });
    }
  }, []);

  const testBackend = useCallback(async () => {
    setBackendResult({ status: 'running', message: 'Pinging backend...' });
    const apiUrl = getConfiguredApiUrl();
    // Derive health URL from tRPC URL (strip /trpc suffix)
    const healthUrl = apiUrl.replace(/\/trpc$/, '/health');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const body = (await res.json()) as { status?: string };
        setBackendResult({
          status: 'pass',
          message: `OK — ${body.status ?? 'connected'} (${res.status})`,
        });
      } else {
        setBackendResult({
          status: 'fail',
          message: `HTTP ${res.status} ${res.statusText}`,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setBackendResult({ status: 'fail', message: msg });
    }
  }, []);

  const runAll = useCallback(async () => {
    await Promise.all([testCamera(), testHealthConnect(), testBackend()]);
  }, [testCamera, testHealthConnect, testBackend]);

  const apiUrl = getConfiguredApiUrl();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <ThemedText variant="h1" style={styles.headerTitle}>Debug</ThemedText>
        <Pressable
          style={styles.runAllButton}
          onPress={() => void runAll()}
          hitSlop={8}
        >
          <Play size={16} color={colors.bg.primary} strokeWidth={2} />
          <ThemedText variant="caption" style={styles.runAllText}>
            Run All
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <Card>
          <View style={styles.cardHeader}>
            <Smartphone size={20} color={colors.accent.lavender} strokeWidth={1.5} />
            <ThemedText variant="h2">App Info</ThemedText>
          </View>
          <View style={styles.infoGrid}>
            <InfoRow label="API URL" value={apiUrl} />
            <InfoRow label="Platform" value={Platform.OS} />
            <InfoRow label="Dev mode" value={__DEV__ ? 'Yes' : 'No'} />
            <InfoRow
              label="Expo SDK"
              value={Constants.expoConfig?.sdkVersion ?? 'Unknown'}
            />
            <InfoRow
              label="App ownership"
              value={Constants.appOwnership ?? 'standalone'}
            />
          </View>
        </Card>

        {/* Camera */}
        <Card>
          <View style={styles.cardHeader}>
            <Camera size={20} color={colors.accent.mint} strokeWidth={1.5} />
            <ThemedText variant="h2">Camera</ThemedText>
            <View style={styles.cardHeaderRight}>
              <StatusIcon status={cameraResult.status} />
            </View>
          </View>
          <ThemedText variant="caption" color="secondary">
            {cameraResult.message}
          </ThemedText>
          <Pressable
            style={styles.testButton}
            onPress={() => void testCamera()}
          >
            <ThemedText variant="caption" color="mint">
              Test Camera Permission
            </ThemedText>
          </Pressable>
        </Card>

        {/* Health Connect */}
        <Card>
          <View style={styles.cardHeader}>
            <Activity size={20} color={colors.accent.lavender} strokeWidth={1.5} />
            <ThemedText variant="h2">Health Connect</ThemedText>
            <View style={styles.cardHeaderRight}>
              <StatusIcon status={hcResult.status} />
            </View>
          </View>
          <ThemedText variant="caption" color="secondary">
            {hcResult.message}
          </ThemedText>
          <Pressable
            style={styles.testButton}
            onPress={() => void testHealthConnect()}
          >
            <ThemedText variant="caption" color="mint">
              Test Health Connect
            </ThemedText>
          </Pressable>
        </Card>

        {/* Backend */}
        <Card>
          <View style={styles.cardHeader}>
            <Wifi size={20} color={colors.accent.yellow} strokeWidth={1.5} />
            <ThemedText variant="h2">Backend</ThemedText>
            <View style={styles.cardHeaderRight}>
              <StatusIcon status={backendResult.status} />
            </View>
          </View>
          <ThemedText variant="caption" color="secondary">
            {backendResult.message}
          </ThemedText>
          <Pressable
            style={styles.testButton}
            onPress={() => void testBackend()}
          >
            <ThemedText variant="caption" color="mint">
              Ping /health
            </ThemedText>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <ThemedText variant="caption" color="muted">
        {label}
      </ThemedText>
      <ThemedText variant="caption" color="secondary" style={styles.infoValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  runAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.mint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  runAllText: {
    color: colors.bg.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeaderRight: {
    marginLeft: 'auto',
  },
  infoGrid: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  testButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent.mint + '15',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.mint + '30',
  },
  idleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
