import { useState, useEffect, useCallback } from 'react';
import { getHealthMetricsByDateRange } from '../services/healthMetricRepository';
import type { HealthMetricType } from '../types/database';
import type { TrendPeriod } from './useTrendData';

interface DataPoint {
  date: string;
  value: number;
}

interface HealthMetricTrendState {
  data: DataPoint[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function getDateRange(days: TrendPeriod): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);

  return {
    startDate: start.toISOString().split('T')[0] as string,
    endDate: end.toISOString().split('T')[0] as string,
  };
}

export function useHealthMetricTrend(
  metricType: HealthMetricType,
  period: TrendPeriod,
): HealthMetricTrendState {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange(period);
      const metrics = await getHealthMetricsByDateRange(metricType, startDate, endDate);

      // Group by date and take the latest value per day
      const byDate = new Map<string, number>();
      for (const m of metrics) {
        const date = m.recorded_at.split('T')[0] as string;
        byDate.set(date, m.value);
      }

      const points: DataPoint[] = [];
      for (const [date, value] of byDate) {
        points.push({ date, value });
      }
      points.sort((a, b) => a.date.localeCompare(b.date));

      setData(points);
    } catch (err) {
      console.error(`Failed to load ${metricType} trend:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [metricType, period]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, refresh };
}
