/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_ENABLE_ROUTE_MESSAGING?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_ANDROID_APK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global constants defined at build time
declare const __ROUTE_MESSAGING_ENABLED__: boolean;
