# Google Analytics Setup

Google Analytics has been integrated into the Next.js App Router application.

## Environment Variable Setup

Add your Google Analytics Measurement ID to your environment variables:

### Local Development (.env.local)

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the variable:
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: Your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`)
   - Environment: Production (and Preview if needed)

## How It Works

1. **GoogleAnalytics Component** (`/components/GoogleAnalytics.tsx`):
   - Loads Google Analytics scripts
   - Tracks route changes automatically in App Router
   - Only loads if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

2. **Gtag Utilities** (`/lib/gtag.ts`):
   - Helper functions for pageview and event tracking
   - TypeScript definitions for gtag

3. **Root Layout Integration** (`/app/layout.tsx`):
   - GoogleAnalytics component added to track all pages

## Usage

### Page Views

Page views are tracked automatically when users navigate between routes.

### Custom Events

```typescript
import { event } from "@/lib/gtag";

// Track custom events
event({
  action: "button_click",
  category: "engagement",
  label: "header_cta",
  value: 1,
});
```

## Testing

1. Deploy to Vercel with the environment variable set
2. Visit your site
3. Check Google Analytics Real-time reports to see page views

## Notes

- Uses `next/script` with `afterInteractive` strategy for optimal performance
- Compatible with Next.js App Router
- Automatically tracks route changes via `usePathname` and `useSearchParams`
- Environment variable must be prefixed with `NEXT_PUBLIC_` to be available in the browser
