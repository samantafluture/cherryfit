import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@cherryfit/backend/src/router';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = __DEV__
  ? 'http://10.0.2.2:3000/trpc'
  : 'https://cherryfit.samantafluture.com/trpc';

export const trpcReactClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
});
