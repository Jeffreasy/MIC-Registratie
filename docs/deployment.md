# Deployment Documentatie

## CI/CD Configuration

### GitHub Actions Workflow
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

## Supabase CLI Configuration
```yaml
# supabase/config.toml
[api]
enabled = true
port = 54321
schemas = ["public", "auth"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
```

## Performance Optimizations

### React Query Configuration
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

// Custom hooks for optimistic updates
export const useOptimisticMutation = (
  queryKey: string[],
  mutationFn: (variables: any) => Promise<any>,
  options = {}
) => {
  return useMutation(mutationFn, {
    onMutate: async (newData) => {
      await queryClient.cancelQueries(queryKey)
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any[]) => [...old, newData])
      return { previousData }
    },
    onError: (err, newData, context: any) => {
      queryClient.setQueryData(queryKey, context.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey)
    },
    ...options,
  })
}
```

### Code Splitting Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs'
          ],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
})
```

### Service Worker for Caching
```typescript
// src/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

precacheAndRoute(self.__WB_MANIFEST)

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
)

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
)
```

### Database Indexing
```sql
-- supabase/migrations/20230903000000_performance_indexes.sql

-- Compound index voor incident logs filtering
CREATE INDEX idx_incident_logs_user_date
ON public.incident_logs (user_id, created_at DESC);

-- Partial index voor hoge prioriteit incidenten
CREATE INDEX idx_high_priority_incidents
ON public.incident_logs (created_at DESC)
WHERE severity >= 8;

-- GiST index voor full-text search
CREATE INDEX idx_incident_description_search
ON public.incident_logs
USING gin(to_tsvector('dutch', description));

-- Covering index voor vaak gebruikte queries
CREATE INDEX idx_profiles_role_email
ON public.profiles (role)
INCLUDE (email, full_name);
``` 