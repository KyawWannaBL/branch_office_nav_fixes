# Rider App Integration

This package adds a dedicated rider-facing app to the existing Britium Express portal.

## Main route
- `#/rider`

## Included views
- Home overview
- Tasks
- Route preview
- Proof of delivery (photo + signature)
- Wallet / COD summary

## Main files
- `src/pages/RiderApp.tsx`
- `src/App.tsx`
- `src/hooks/useAuth.tsx`
- `src/components/Layout.tsx`
- `src/hooks/useLanguage.tsx`
- `src/lib/index.ts`
- `src/pages/Login.tsx`

## Notes
- Rider accounts now land on `#/rider` after password login.
- Existing driver portal remains unchanged.
- Super admin, admin, and branch office roles can also open the rider route for testing.
