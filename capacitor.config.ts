import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lumen.mobile',
  appName: 'Lumen',
  webDir: 'dist',
  android: {
    // Required so the WebView (served from https://localhost) can fetch the
    // desktop WiFi-share server, which runs over plain http on the LAN.
    allowMixedContent: true,
  },
}

export default config
