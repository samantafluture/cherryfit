import { create } from 'zustand';
import { getTodayMetric } from '../services/healthMetricRepository';
import type { HealthMetricType } from '../types/database';

interface HealthMetrics {
  steps: number | null;
  sleepMinutes: number | null;
  restingHr: number | null;
  activeMinutes: number | null;
  caloriesBurned: number | null;
}

interface HealthStoreState {
  metrics: HealthMetrics;
  isLoading: boolean;
  lastSynced: string | null;
  loadTodayMetrics: () => Promise<void>;
}

const defaultMetrics: HealthMetrics = {
  steps: null,
  sleepMinutes: null,
  restingHr: null,
  activeMinutes: null,
  caloriesBurned: null,
};

const metricKeyMap: [keyof HealthMetrics, HealthMetricType][] = [
  ['steps', 'steps'],
  ['sleepMinutes', 'sleep_minutes'],
  ['restingHr', 'heart_rate_resting'],
  ['activeMinutes', 'active_minutes'],
  ['caloriesBurned', 'calories_burned'],
];

export const useHealthStore = create<HealthStoreState>((set) => ({
  metrics: defaultMetrics,
  isLoading: false,
  lastSynced: null,

  loadTodayMetrics: async () => {
    set({ isLoading: true });
    try {
      const results: Partial<HealthMetrics> = {};

      for (const [key, metricType] of metricKeyMap) {
        const metric = await getTodayMetric(metricType);
        results[key] = metric?.value ?? null;
      }

      set({
        metrics: { ...defaultMetrics, ...results },
        lastSynced: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to load health metrics:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
