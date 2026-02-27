import { z } from 'zod';

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const foodSourceSchema = z.enum([
  'label_scan',
  'barcode',
  'photo_ai',
  'restaurant',
  'manual',
  'quick_log',
]);

export const macrosSchema = z.object({
  calories: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  fiber_g: z.number().min(0).nullable(),
  sugar_g: z.number().min(0).nullable(),
  sodium_mg: z.number().min(0).nullable(),
});

export const createFoodLogSchema = z.object({
  food_name: z.string().min(1).max(255),
  meal_type: mealTypeSchema,
  source: foodSourceSchema,
  serving_size: z.string().min(1).max(100),
  servings: z.number().min(0.25).max(99),
  macros: macrosSchema,
  logged_at: z.string().datetime().optional(),
});

export const updateFoodLogSchema = createFoodLogSchema.partial();
