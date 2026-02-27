import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import { createFoodLogSchema } from '@cherryfit/shared';

export const foodRouter = router({
  getDaily: publicProcedure
    .input(z.object({ date: z.string().date() }))
    .query(async ({ input: _input }) => {
      // TODO: Implement in Phase 1
      return [];
    }),

  log: publicProcedure.input(createFoodLogSchema).mutation(async ({ input: _input }) => {
    // TODO: Implement in Phase 1
    return { success: true };
  }),
});
