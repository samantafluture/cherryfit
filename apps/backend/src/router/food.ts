import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import { createFoodLogSchema } from '@cherryfit/shared';
import { foodLogs } from '../db/schema';
import { GeminiService } from '../services/gemini';

const syncFoodLogSchema = z.object({
  id: z.string().uuid(),
  food_name: z.string(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  source: z.enum(['label_scan', 'barcode', 'photo_ai', 'restaurant', 'manual', 'quick_log']),
  serving_size: z.string(),
  servings: z.number(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
  photo_url: z.string().nullable().optional(),
  ai_confidence: z.number().nullable().optional(),
  logged_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const foodRouter = router({
  getDaily: publicProcedure
    .input(z.object({ date: z.string().date() }))
    .query(async ({ ctx, input }) => {
      const startOfDay = `${input.date}T00:00:00.000Z`;
      const endOfDay = `${input.date}T23:59:59.999Z`;

      return ctx.db
        .select()
        .from(foodLogs)
        .where(
          and(
            eq(foodLogs.userId, ctx.userId),
            gte(foodLogs.loggedAt, new Date(startOfDay)),
            lte(foodLogs.loggedAt, new Date(endOfDay)),
          ),
        );
    }),

  log: publicProcedure.input(createFoodLogSchema).mutation(async ({ ctx, input }) => {
    const [result] = await ctx.db
      .insert(foodLogs)
      .values({
        userId: ctx.userId,
        foodName: input.food_name,
        mealType: input.meal_type,
        source: input.source,
        servingSize: input.serving_size,
        servings: String(input.servings),
        calories: String(input.macros.calories),
        proteinG: String(input.macros.protein_g),
        carbsG: String(input.macros.carbs_g),
        fatG: String(input.macros.fat_g),
        fiberG: input.macros.fiber_g != null ? String(input.macros.fiber_g) : null,
        sugarG: input.macros.sugar_g != null ? String(input.macros.sugar_g) : null,
        sodiumMg: input.macros.sodium_mg != null ? String(input.macros.sodium_mg) : null,
        loggedAt: input.logged_at ? new Date(input.logged_at) : new Date(),
      })
      .returning();

    return result;
  }),

  syncBatch: publicProcedure
    .input(z.object({ logs: z.array(syncFoodLogSchema) }))
    .mutation(async ({ ctx, input }) => {
      const synced: string[] = [];

      for (const log of input.logs) {
        try {
          await ctx.db
            .insert(foodLogs)
            .values({
              id: log.id,
              userId: ctx.userId,
              foodName: log.food_name,
              mealType: log.meal_type,
              source: log.source,
              servingSize: log.serving_size,
              servings: String(log.servings),
              calories: String(log.calories),
              proteinG: String(log.protein_g),
              carbsG: String(log.carbs_g),
              fatG: String(log.fat_g),
              fiberG: log.fiber_g != null ? String(log.fiber_g) : null,
              sugarG: log.sugar_g != null ? String(log.sugar_g) : null,
              sodiumMg: log.sodium_mg != null ? String(log.sodium_mg) : null,
              loggedAt: new Date(log.logged_at),
              createdAt: new Date(log.created_at),
              updatedAt: new Date(log.updated_at),
            })
            .onConflictDoUpdate({
              target: foodLogs.id,
              set: {
                foodName: log.food_name,
                calories: String(log.calories),
                proteinG: String(log.protein_g),
                carbsG: String(log.carbs_g),
                fatG: String(log.fat_g),
                fiberG: log.fiber_g != null ? String(log.fiber_g) : null,
                sugarG: log.sugar_g != null ? String(log.sugar_g) : null,
                sodiumMg: log.sodium_mg != null ? String(log.sodium_mg) : null,
                updatedAt: new Date(log.updated_at),
              },
            });

          synced.push(log.id);
        } catch (err) {
          console.error(`Failed to sync food log ${log.id}:`, err);
        }
      }

      return { synced, failed: input.logs.length - synced.length };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, ctx.userId));
  }),

  scanLabel: publicProcedure
    .input(
      z.object({
        image: z.string(),
        mediaType: z.string().default('image/jpeg'),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env['GEMINI_API_KEY'];
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const model = process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash';
      const gemini = new GeminiService(apiKey, model);
      return gemini.scanNutritionLabel(input.image, input.mediaType);
    }),
});
