import { router, publicProcedure } from './trpc';

export const bloodRouter = router({
  getHistory: publicProcedure.query(async () => {
    // TODO: Implement in Phase 4
    return [];
  }),
});
