import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { createFoodLogSchema } from '@cherryfit/shared';
import { foodLogs } from '../db/schema';
import { GeminiService } from '../services/gemini';
import { OpenFoodFactsService } from '../services/openfoodfacts';

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

  analyzePhoto: publicProcedure
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
      return gemini.analyzeFoodPhoto(input.image, input.mediaType);
    }),

  lookupBarcode: publicProcedure
    .input(z.object({ barcode: z.string().min(8).max(14) }))
    .query(async ({ input }) => {
      const off = new OpenFoodFactsService();
      return off.lookupBarcode(input.barcode);
    }),

  getDailyTrends: publicProcedure
    .input(
      z.object({
        startDate: z.string().date(),
        endDate: z.string().date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = `${input.startDate}T00:00:00.000Z`;
      const end = `${input.endDate}T23:59:59.999Z`;

      const rows = await ctx.db
        .select({
          date: sql<string>`DATE(${foodLogs.loggedAt})`.as('date'),
          calories: sql<string>`COALESCE(SUM(CAST(${foodLogs.calories} AS NUMERIC) * CAST(${foodLogs.servings} AS NUMERIC)), 0)`.as('calories'),
          protein_g: sql<string>`COALESCE(SUM(CAST(${foodLogs.proteinG} AS NUMERIC) * CAST(${foodLogs.servings} AS NUMERIC)), 0)`.as('protein_g'),
          carbs_g: sql<string>`COALESCE(SUM(CAST(${foodLogs.carbsG} AS NUMERIC) * CAST(${foodLogs.servings} AS NUMERIC)), 0)`.as('carbs_g'),
          fat_g: sql<string>`COALESCE(SUM(CAST(${foodLogs.fatG} AS NUMERIC) * CAST(${foodLogs.servings} AS NUMERIC)), 0)`.as('fat_g'),
        })
        .from(foodLogs)
        .where(
          and(
            eq(foodLogs.userId, ctx.userId),
            gte(foodLogs.loggedAt, new Date(start)),
            lte(foodLogs.loggedAt, new Date(end)),
          ),
        )
        .groupBy(sql`DATE(${foodLogs.loggedAt})`)
        .orderBy(sql`DATE(${foodLogs.loggedAt})`);

      return rows.map((row) => ({
        date: row.date,
        calories: Math.round(Number(row.calories)),
        protein_g: Math.round(Number(row.protein_g) * 10) / 10,
        carbs_g: Math.round(Number(row.carbs_g) * 10) / 10,
        fat_g: Math.round(Number(row.fat_g) * 10) / 10,
      }));
    }),
});
