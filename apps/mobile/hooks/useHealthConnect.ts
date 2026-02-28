import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useHealthStore } from '../stores/useHealthStore';
import { saveHealthMetric } from '../services/healthMetricRepository';
import * as MockService from '../services/healthConnectMock';
import type { HealthConnectData } from '../services/healthConnectMock';
import type { HealthMetricType } from '../types/database';

interface HealthConnectService {
  isHealthConnectAvailable: () => Promise<boolean>;
  initializeHealthConnect: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  readTodayData: () => Promise<HealthConnectData>;
}

interface HealthConnectState {
  isAvailable: boolean;
  hasPermissions: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  requestPermissions: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// Eagerly require and initialize Health Connect at module scope (during JS bundle
// evaluation, which happens inside Activity.onCreate). This ensures the library's
// ActivityResultLauncher is registered before the Activity is fully created — the
// requirement that caused the "lateinit property requestPermission not initialized" crash.
let earlyService: HealthConnectService | null = null;
if (Platform.OS === 'android' && !isExpoGo()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    earlyService = require('../services/healthConnect') as HealthConnectService;
    void earlyService.initializeHealthConnect();
  } catch {
    // Native module not linked — will fall back to mock
  }
}

export function useHealthConnect(): HealthConnectState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const loadTodayMetrics = useHealthStore((s) => s.loadTodayMetrics);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realServiceRef = useRef<HealthConnectService | null>(null);

  // Check availability on mount — uses the module-scope earlyService
  useEffect(() => {
    async function checkAvailability(): Promise<void> {
      if (!earlyService) {
        setIsAvailable(false);
        return;
      }

      try {
        realServiceRef.current = earlyService;
        const available = await earlyService.isHealthConnectAvailable();
        setIsAvailable(available);
        if (available) {
          await earlyService.initializeHealthConnect();
        }
      } catch {
        setIsAvailable(false);
      }
    }
    void checkAvailability();
  }, []);

  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const service = realServiceRef.current;
      const data = service
        ? await service.readTodayData()
        : await MockService.readTodayData();

      const now = new Date().toISOString();

      const metricsToSave: [HealthMetricType, number][] = [
        ['steps', data.steps],
        ['sleep_minutes', data.sleepMinutes],
        ['heart_rate_resting', data.restingHr],
        ['active_minutes', data.activeMinutes],
        ['calories_burned', data.caloriesBurned],
      ];

      for (const [type, value] of metricsToSave) {
        if (value > 0) {
          await saveHealthMetric(type, value, now, 'health_connect');
        }
      }

      await loadTodayMetrics();
      setLastSynced(now);
    } catch (err) {
      console.error('Health Connect sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [loadTodayMetrics]);

  const requestPerms = useCallback(async () => {
    const service = realServiceRef.current;
    if (!service) return;

    const granted = await service.requestPermissions();
    setHasPermissions(granted);
    if (granted) {
      await syncData();
    }
  }, [syncData]);

  // Set up periodic sync when app is foregrounded
  useEffect(() => {
    if (!hasPermissions || !isAvailable) return;

    // Sync immediately
    void syncData();

    // Set up interval
    intervalRef.current = setInterval(() => {
      void syncData();
    }, SYNC_INTERVAL_MS);

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncData();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [hasPermissions, isAvailable, syncData]);

  return {
    isAvailable,
    hasPermissions,
    isSyncing,
    lastSynced,
    requestPermissions: requestPerms,
    syncNow: syncData,
  };
}
