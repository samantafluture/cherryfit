import type { LocalFoodLog } from '../types/database';

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export function calculateDailyTotals(logs: LocalFoodLog[]): MacroTotals {
  return logs.reduce<MacroTotals>(
    (totals, log) => ({
      calories: totals.calories + log.calories * log.servings,
      protein_g: totals.protein_g + log.protein_g * log.servings,
      carbs_g: totals.carbs_g + log.carbs_g * log.servings,
      fat_g: totals.fat_g + log.fat_g * log.servings,
      fiber_g: totals.fiber_g + (log.fiber_g ?? 0) * log.servings,
      sugar_g: totals.sugar_g + (log.sugar_g ?? 0) * log.servings,
      sodium_mg: totals.sodium_mg + (log.sodium_mg ?? 0) * log.servings,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  );
}

export function estimateCalories(protein_g: number, carbs_g: number, fat_g: number): number {
  return Math.round(protein_g * 4 + carbs_g * 4 + fat_g * 9);
}

export function macroPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(current / target, 1);
}
