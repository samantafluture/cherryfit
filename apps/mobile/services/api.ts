import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@cherryfit/backend/src/router';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = __DEV__
  ? 'http://10.0.2.2:3000/trpc'
  : 'https://cherryfit.samantafluture.com/trpc';

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
});
