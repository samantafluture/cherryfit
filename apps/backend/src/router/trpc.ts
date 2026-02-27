import { initTRPC } from '@trpc/server';
import type { Database } from '../db';

export interface Context {
  db: Database;
  userId: string;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
