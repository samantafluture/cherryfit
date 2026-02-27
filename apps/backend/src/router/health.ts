import { router, publicProcedure } from './trpc';

export const healthRouter = router({
  getDashboard: publicProcedure.query(async () => {
    // TODO: Implement in Phase 2
    return { steps: 0, sleepMinutes: 0, restingHr: 0, activeMinutes: 0 };
  }),
});
