import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rifqa.app',
  appName: 'رفقة الإنجاز',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
