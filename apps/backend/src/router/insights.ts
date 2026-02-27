import { router, publicProcedure } from './trpc';

export const insightsRouter = router({
  getRecent: publicProcedure.query(async () => {
    // TODO: Implement in Phase 4
    return [];
  }),
});
