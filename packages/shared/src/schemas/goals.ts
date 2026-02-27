import { z } from 'zod';

export const dailyGoalSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(1000),
  fiber_g: z.number().min(0).max(200).nullable(),
  sugar_g: z.number().min(0).max(500).nullable(),
  sodium_mg: z.number().min(0).max(10000).nullable(),
});

export const updateDailyGoalSchema = dailyGoalSchema.partial();
