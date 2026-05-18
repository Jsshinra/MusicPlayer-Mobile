import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lumen.mobile',
  appName: 'Lumen',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
