import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config: _config }: ConfigContext): ExpoConfig => ({
  name: 'CherryFit',
  slug: 'cherryfit',
  version: '0.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'cherryfit',
  splash: {
    backgroundColor: '#0D0D11',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0D0D11',
    },
    package: 'dev.cherryfit.app',
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
});
