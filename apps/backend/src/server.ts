import 'dotenv/config';
import Fastify from 'fastify';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { appRouter, type AppRouter } from './router';
import { db } from './db';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Fitbit OAuth callback — redirects to mobile deep link with auth code
app.get('/api/fitbit/callback', async (request, reply) => {
  const { code, state } = request.query as { code?: string; state?: string };

  if (!code) {
    return reply.status(400).send({ error: 'Missing authorization code' });
  }

  // Redirect to the mobile app with the code via deep link
  const deepLink = `cherryfit://fitbit-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state ?? '')}`;
  return reply.redirect(deepLink);
});

app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: () => ({
      db,
      userId: DEFAULT_USER_ID,
    }),
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

async function start(): Promise<void> {
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
