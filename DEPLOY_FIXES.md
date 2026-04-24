# Deployment fixes included

This package was patched to be deploy-ready for Vercel / static Vite hosting.

Included fixes:
- restored missing `index.html`
- added `tsconfig.app.json` and `tsconfig.node.json`
- added `vercel.json`
- added placeholder assets under `public/`
- password reset now prefers `VITE_SITE_URL` and falls back to the current origin
- Mapbox now accepts either `VITE_MAPBOX_ACCESS_TOKEN` or `VITE_MAPBOX_TOKEN`
- APK prompt now only appears when `VITE_ANDROID_APK_URL` is configured
- realtime websocket no longer auto-connects to localhost in production when `VITE_WS_URL` is missing

Environment notes:
- required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- recommended in production: `VITE_SITE_URL`
- do not add `VERCEL_OIDC_TOKEN` to the client `.env` file
