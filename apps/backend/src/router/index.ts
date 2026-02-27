import { router } from './trpc';
import { foodRouter } from './food';
import { workoutRouter } from './workout';
import { healthRouter } from './health';
import { bloodRouter } from './blood';
import { insightsRouter } from './insights';

export const appRouter = router({
  food: foodRouter,
  workout: workoutRouter,
  health: healthRouter,
  blood: bloodRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;
