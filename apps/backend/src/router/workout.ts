import { router, publicProcedure } from './trpc';

export const workoutRouter = router({
  getHistory: publicProcedure.query(async () => {
    // TODO: Implement in Phase 3
    return [];
  }),
});
