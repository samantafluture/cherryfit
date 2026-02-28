import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../services/database';
import type { DailyNutritionSummary } from '../types/database';

export type TrendPeriod = 7 | 14 | 30 | 90;

interface TrendDataState {
  nutritionTrends: DailyNutritionSummary[];
  isLoading: boolean;
  period: TrendPeriod;
  setPeriod: (period: TrendPeriod) => void;
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

interface RawNutritionRow {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function useTrendData(): TrendDataState {
  const [period, setPeriod] = useState<TrendPeriod>(7);
  const [nutritionTrends, setNutritionTrends] = useState<DailyNutritionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNutritionTrends = useCallback(async (days: TrendPeriod) => {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const { startDate, endDate } = getDateRange(days);
      const start = `${startDate}T00:00:00.000Z`;
      const end = `${endDate}T23:59:59.999Z`;

      const rows = await db.getAllAsync<RawNutritionRow>(
        `SELECT
          DATE(logged_at) as date,
          COALESCE(SUM(calories * servings), 0) as calories,
          COALESCE(SUM(protein_g * servings), 0) as protein_g,
          COALESCE(SUM(carbs_g * servings), 0) as carbs_g,
          COALESCE(SUM(fat_g * servings), 0) as fat_g
        FROM food_logs
        WHERE logged_at >= ? AND logged_at <= ?
        GROUP BY DATE(logged_at)
        ORDER BY DATE(logged_at)`,
        start,
        end,
      );

      const summaries: DailyNutritionSummary[] = rows.map((row) => ({
        date: row.date,
        calories: Math.round(row.calories),
        protein_g: Math.round(row.protein_g * 10) / 10,
        carbs_g: Math.round(row.carbs_g * 10) / 10,
        fat_g: Math.round(row.fat_g * 10) / 10,
      }));

      setNutritionTrends(summaries);
    } catch (err) {
      console.error('Failed to load nutrition trends:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadNutritionTrends(period);
  }, [period, loadNutritionTrends]);

  useEffect(() => {
    void loadNutritionTrends(period);
  }, [period, loadNutritionTrends]);

  return { nutritionTrends, isLoading, period, setPeriod, refresh };
}
