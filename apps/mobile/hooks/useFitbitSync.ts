import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { syncToFitbit } from '../services/fitbitSync';

interface FitbitSyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  lastResult: { synced: number; total: number } | null;
  syncNow: () => Promise<void>;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useFitbitSync(enabled: boolean): FitbitSyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ synced: number; total: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSync = useCallback(async () => {
    if (!enabled) return;

    setIsSyncing(true);
    try {
      const result = await syncToFitbit();
      setLastResult(result);
      if (result.synced > 0) {
        setLastSynced(new Date().toISOString());
      }
    } catch (err) {
      console.error('Fitbit sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [enabled]);

  // Set up periodic sync
  useEffect(() => {
    if (!enabled) return;

    // Sync immediately
    void doSync();

    // Set up interval
    intervalRef.current = setInterval(() => {
      void doSync();
    }, SYNC_INTERVAL_MS);

    // Sync on app foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void doSync();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [enabled, doSync]);

  return { isSyncing, lastSynced, lastResult, syncNow: doSync };
}
