# Performance Optimizations - Kniferoll

## Changes Made (Dec 26, 2025)

### 1. **Disabled React.StrictMode in Production**

- **File**: `apps/web/src/main.tsx`
- **Impact**: Eliminates double-rendering in production, reducing JavaScript execution time
- **Details**: StrictMode is only enabled in development mode

### 2. **Lazy Loading for Route Components**

- **File**: `apps/web/src/App.tsx`
- **Impact**: Reduces initial bundle size by code-splitting all page components
- **Details**: All pages now lazy-load with Suspense fallback
- **Expected improvement**: ~30-40% reduction in initial JavaScript bundle

### 3. **Deferred Analytics & Monitoring**

- **File**: `apps/web/src/main.tsx`
- **Impact**: Delays Vercel Analytics and SpeedInsights from blocking initial render
- **Details**: Now lazy-loaded with Suspense fallback
- **Expected improvement**: ~200-300ms faster FCP

### 4. **Smart Initialization**

- **File**: `apps/web/src/main.tsx` & `apps/web/src/App.tsx`
- **Impact**: Auth and offline store initialize using `requestIdleCallback` when browser is free
- **Details**: Prevents auth checks from blocking first interaction
- **Expected improvement**: ~500-800ms faster INP

### 5. **Advanced Vite Configuration**

- **File**: `apps/web/vite.config.ts`
- **Changes**:
  - Manual chunk splitting for vendor libraries (React, Supabase, React Query, etc.)
  - Terser minification with console removal in production
  - Reduced service worker cache settings (20 entries, 12-hour expiration)
- **Expected improvement**: ~15-20% smaller bundle size, faster caching

### 6. **Resource Preloading**

- **File**: `apps/web/index.html`
- **Changes**:
  - DNS prefetch and preconnect to Supabase CDN
  - Preload critical CSS
  - Resource hints for faster navigation
- **Expected improvement**: ~100-150ms faster Supabase requests

### 7. **React Component Optimization with memo()**

- **Files Modified**:
  - `components/PrepItemList.tsx`
  - `components/StationCard.tsx`
  - `components/StationList.tsx`
  - `components/ProgressBar.tsx`
  - `components/FeatureCard.tsx`
  - `components/Button.tsx`
- **Impact**: Prevents unnecessary re-renders of frequently rendered components
- **Expected improvement**: ~100-200ms faster interactions on list updates

### 8. **Skeleton Loading Components**

- **File**: `components/Skeleton.tsx` (new)
- **Components Created**:
  - `SkeletonCard` - Generic loading state for cards
  - `SkeletonList` - Multiple skeleton cards
  - `SkeletonStationCard` - Station-specific loading state
  - `SkeletonProgress` - Progress bar loading state
  - `SkeletonFormInput` - Form input loading state
- **Usage**: Can be used in async pages to show immediate feedback
- **Expected improvement**: Better perceived performance (LCP metric)

### 9. **QueryClient Optimization**

- **File**: `apps/web/src/main.tsx`
- **Changes**:
  - Increased `gcTime` (cache time) to 10 minutes for better cache hit rates
  - Maintained 5-minute stale time for fresh data
- **Expected improvement**: Fewer unnecessary API requests, better UX

## Expected Performance Improvements

Based on the metrics provided:

- **FCP**: 2.34s → ~1.8-2.0s (15-23% improvement)
- **LCP**: 2.34s → ~1.6-1.8s (20-30% improvement)
- **INP**: 2,224ms → ~800-1,200ms (50-65% improvement) ⭐
- **TTFB**: 0.67s → No change (backend optimization needed)

## Next Steps for Further Optimization

### High Priority

1. **Backend optimization**: TTFB is still 0.67s - optimize Supabase queries and response times
2. **Image optimization**:
   - Add width/height dimensions to all images
   - Use modern formats (WebP with fallbacks)
   - Lazy load images below the fold
3. **API optimization**:
   - Implement request batching
   - Cache more aggressively on client
   - Reduce payload sizes

### Medium Priority

1. **Bundle analysis**:

   ```bash
   npm run build && npx vite-bundle-visualizer
   ```

   - Identify large dependencies
   - Consider alternatives if needed

2. **Critical CSS**:

   - Inline above-the-fold CSS in `index.html`
   - Defer non-critical CSS

3. **Web Fonts**:
   - If using custom fonts, use `font-display: swap`
   - Consider system fonts for faster rendering

### Low Priority

1. **HTTP/2 Server Push**
2. **Compression** (gzip/brotli) - verify on hosting
3. **CDN** for static assets

## Testing Performance

### Local Development

```bash
npm run build
npm run preview
# Then use Chrome DevTools Lighthouse
```

### Production

- Use PageSpeed Insights: https://pagespeed.web.dev/
- Use WebPageTest: https://www.webpagetest.org/
- Monitor with Vercel Analytics dashboard

## Bundle Size Targets

- Initial JS: < 150KB (gzipped)
- Route chunks: < 50KB each
- Total CSS: < 30KB

## Monitoring

Enable these in production:

- Vercel Speed Insights (already implemented)
- Vercel Analytics (already implemented)
- Consider Sentry for error tracking

## Cache Strategy

- Service Worker: Network-first for API calls, Cache-first for assets
- Browser: 12 hours for Supabase API responses
- Static assets: Forever (with content-based versioning via Vite)
