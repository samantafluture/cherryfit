import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { AppRouter } from '@cherryfit/backend/src/router';

export const trpc = createTRPCReact<AppRouter>();

function getDevApiUrl(): string {
  // In dev, try to get the IP from Expo's hostUri (works on physical devices)
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.10:8081"
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000/trpc`;
  }

  // Fallback: Android emulator localhost alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/trpc';
  }

  return 'http://localhost:3000/trpc';
}

const API_URL = __DEV__
  ? getDevApiUrl()
  : 'https://cherryfit.samantafluture.com/trpc';

/** Exported for the debug screen */
export function getConfiguredApiUrl(): string {
  return API_URL;
}

function fetchWithTimeout(timeout: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(id),
    );
  };
}

export const trpcReactClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_URL,
      fetch: fetchWithTimeout(15_000),
    }),
  ],
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      fetch: fetchWithTimeout(15_000),
    }),
  ],
});
