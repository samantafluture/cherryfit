import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import { healthMetrics, fitbitTokens, foodLogs } from '../db/schema';
import { FitbitService } from '../services/fitbit';
import * as Crypto from 'crypto';

const healthMetricTypeValues = [
  'steps',
  'sleep_minutes',
  'heart_rate_resting',
  'heart_rate_avg',
  'active_minutes',
  'calories_burned',
  'weight_kg',
  'body_fat_percent',
] as const;

const saveMetricSchema = z.object({
  metric_type: z.enum(healthMetricTypeValues),
  value: z.number(),
  recorded_at: z.string(),
  source: z.string(),
});

function getFitbitService(): FitbitService | null {
  const clientId = process.env['FITBIT_CLIENT_ID'];
  const clientSecret = process.env['FITBIT_CLIENT_SECRET'];
  const redirectUri = process.env['FITBIT_REDIRECT_URI'];

  if (!clientId || !clientSecret || !redirectUri) return null;

  return new FitbitService(clientId, clientSecret, redirectUri);
}

export const healthRouter = router({
  getDashboard: publicProcedure.query(async () => {
    // TODO: Implement in Phase 2 (Health Connect)
    return { steps: 0, sleepMinutes: 0, restingHr: 0, activeMinutes: 0 };
  }),

  getMetricHistory: publicProcedure
    .input(
      z.object({
        metricType: z.enum(healthMetricTypeValues),
        startDate: z.string().date(),
        endDate: z.string().date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = `${input.startDate}T00:00:00.000Z`;
      const end = `${input.endDate}T23:59:59.999Z`;

      const rows = await ctx.db
        .select()
        .from(healthMetrics)
        .where(
          and(
            eq(healthMetrics.userId, ctx.userId),
            eq(healthMetrics.metricType, input.metricType),
            gte(healthMetrics.recordedAt, new Date(start)),
            lte(healthMetrics.recordedAt, new Date(end)),
          ),
        );

      return rows.map((row) => ({
        id: row.id,
        metric_type: row.metricType,
        value: Number(row.value),
        recorded_at: row.recordedAt.toISOString(),
        source: row.source,
      }));
    }),

  saveBatch: publicProcedure
    .input(z.object({ metrics: z.array(saveMetricSchema) }))
    .mutation(async ({ ctx, input }) => {
      const saved: string[] = [];

      for (const metric of input.metrics) {
        try {
          const [result] = await ctx.db
            .insert(healthMetrics)
            .values({
              userId: ctx.userId,
              metricType: metric.metric_type,
              value: String(metric.value),
              recordedAt: new Date(metric.recorded_at),
              source: metric.source,
            })
            .returning();

          if (result) {
            saved.push(result.id);
          }
        } catch (err) {
          console.error('Failed to save health metric:', err);
        }
      }

      return { saved: saved.length, failed: input.metrics.length - saved.length };
    }),

  // Fitbit OAuth
  getFitbitAuthUrl: publicProcedure.query(() => {
    const fitbit = getFitbitService();
    if (!fitbit) {
      return { url: null, configured: false };
    }

    const state = Crypto.randomUUID();
    const url = fitbit.getAuthorizationUrl(state);
    return { url, configured: true, state };
  }),

  handleFitbitCallback: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fitbit = getFitbitService();
      if (!fitbit) {
        throw new Error('Fitbit not configured');
      }

      const tokens = await fitbit.exchangeCode(input.code);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Upsert tokens
      const existing = await ctx.db
        .select()
        .from(fitbitTokens)
        .where(eq(fitbitTokens.userId, ctx.userId));

      if (existing.length > 0) {
        await ctx.db
          .update(fitbitTokens)
          .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
            fitbitUserId: tokens.user_id,
            updatedAt: new Date(),
          })
          .where(eq(fitbitTokens.userId, ctx.userId));
      } else {
        await ctx.db.insert(fitbitTokens).values({
          userId: ctx.userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          fitbitUserId: tokens.user_id,
        });
      }

      return { success: true, fitbitUserId: tokens.user_id };
    }),

  getFitbitStatus: publicProcedure.query(async ({ ctx }) => {
    const fitbit = getFitbitService();
    if (!fitbit) {
      return { configured: false, connected: false };
    }

    const tokens = await ctx.db
      .select()
      .from(fitbitTokens)
      .where(eq(fitbitTokens.userId, ctx.userId));

    if (tokens.length === 0) {
      return { configured: true, connected: false };
    }

    return {
      configured: true,
      connected: true,
      fitbitUserId: tokens[0]!.fitbitUserId,
      expiresAt: tokens[0]!.expiresAt.toISOString(),
    };
  }),

  disconnectFitbit: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(fitbitTokens)
      .where(eq(fitbitTokens.userId, ctx.userId));

    return { success: true };
  }),

  syncFoodToFitbit: publicProcedure
    .input(z.object({ logIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const fitbit = getFitbitService();
      if (!fitbit) {
        throw new Error('Fitbit not configured');
      }

      // Get tokens
      const tokenRows = await ctx.db
        .select()
        .from(fitbitTokens)
        .where(eq(fitbitTokens.userId, ctx.userId));

      if (tokenRows.length === 0) {
        throw new Error('Fitbit not connected');
      }

      let token = tokenRows[0]!;

      // Refresh if expired
      if (new Date(token.expiresAt) <= new Date()) {
        const refreshed = await fitbit.refreshTokens(token.refreshToken);
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);

        await ctx.db
          .update(fitbitTokens)
          .set({
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: newExpiry,
            updatedAt: new Date(),
          })
          .where(eq(fitbitTokens.userId, ctx.userId));

        token = { ...token, accessToken: refreshed.access_token };
      }

      // Get food logs to sync
      const logs = await ctx.db
        .select()
        .from(foodLogs)
        .where(
          and(
            eq(foodLogs.userId, ctx.userId),
            eq(foodLogs.fitbitSynced, false),
          ),
        );

      const toSync = input.logIds.length > 0
        ? logs.filter((l) => input.logIds.includes(l.id))
        : logs;

      let synced = 0;
      for (const log of toSync) {
        try {
          const logDate = log.loggedAt.toISOString().split('T')[0] as string;
          await fitbit.logFood(token.accessToken, {
            foodName: log.foodName,
            calories: Math.round(Number(log.calories) * Number(log.servings)),
            mealTypeId: FitbitService.mealTypeToFitbitId(log.mealType),
            date: logDate,
          });

          await ctx.db
            .update(foodLogs)
            .set({ fitbitSynced: true })
            .where(eq(foodLogs.id, log.id));

          synced++;
        } catch (err) {
          console.error(`Failed to sync food log ${log.id} to Fitbit:`, err);
        }
      }

      return { synced, total: toSync.length };
    }),
});
