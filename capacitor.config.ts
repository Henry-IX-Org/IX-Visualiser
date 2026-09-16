import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.djmix.visualiser',
  appName: 'DJ Mix Visualiser',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
