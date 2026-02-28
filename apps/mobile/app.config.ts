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
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_SLEEP',
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
      'android.permission.health.READ_EXERCISE',
    ],
  },
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-dev-client',
    'expo-camera',
    'expo-image-picker',
    [
      'react-native-health-connect',
      {
        requestPermissions: true,
      },
    ],
    'expo-sqlite',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '7846bb1a-a8f0-4ad4-abdd-fa520630df22',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
