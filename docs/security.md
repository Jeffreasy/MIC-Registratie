# Security Documentatie

## Content Security Policy
```typescript
// src/middleware/security.ts
export const CSP_HEADER = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://res.cloudinary.com;
    font-src 'self' data:;
    connect-src 'self' ${process.env.VITE_SUPABASE_URL} https://api.stripe.com;
    frame-src 'self' https://js.stripe.com;
    object-src 'none';
  `.replace(/\s{2,}/g, ' ').trim()
}
```

## Rate Limiting Edge Function
```typescript
// supabase/functions/rateLimit.ts
const RATE_LIMIT = 100 // requests
const WINDOW_SIZE = 60 * 1000 // 1 minute in ms

interface RateLimitState {
  requests: number
  windowStart: number
}

const rateLimitStates = new Map<string, RateLimitState>()

export function rateLimit(clientId: string): boolean {
  const now = Date.now()
  const state = rateLimitStates.get(clientId) || { requests: 0, windowStart: now }

  if (now - state.windowStart >= WINDOW_SIZE) {
    state.requests = 1
    state.windowStart = now
  } else {
    state.requests++
  }

  rateLimitStates.set(clientId, state)
  return state.requests <= RATE_LIMIT
}
```

## Row Level Security Policies
```sql
-- supabase/migrations/20230902000000_security_policies.sql

-- Incident logs policies
CREATE POLICY "Users can view their own incidents"
ON public.incident_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all incidents"
ON public.incident_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Audit logging
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Error Handling en Logging

### Error Types en Utilities
```typescript
// Custom error types
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Error mapper utility
export const mapSupabaseError = (error: any): Error => {
  const message = error?.message || 'Er is een onbekende fout opgetreden'
  const code = error?.code

  switch (code) {
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new AuthenticationError(message, code)
    case '23505': // unique violation
    case '23503': // foreign key violation
      return new DatabaseError(message, code)
    default:
      return new Error(message)
  }
}
```

### Global Error Boundary
```typescript
interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  ErrorBoundaryState
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log naar error tracking service
    logger.error(error, { 
      extra: errorInfo,
      tags: { component: 'ErrorBoundary' }
    })
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

### Logger Configuration
```typescript
interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enabled: boolean;
  extras?: Record<string, any>;
}

class Logger {
  private config: LoggerConfig = {
    level: import.meta.env.DEV ? 'debug' : 'info',
    enabled: true
  }

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  private formatMessage(level: string, message: string, extra?: any) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.config.extras,
      ...extra
    }
  }

  debug(message: string, extra?: any) {
    if (!this.config.enabled || this.config.level !== 'debug') return
    console.debug(this.formatMessage('debug', message, extra))
  }

  info(message: string, extra?: any) {
    if (!this.config.enabled) return
    console.info(this.formatMessage('info', message, extra))
  }

  warn(message: string, extra?: any) {
    if (!this.config.enabled) return
    console.warn(this.formatMessage('warn', message, extra))
  }

  error(error: Error | string, extra?: any) {
    if (!this.config.enabled) return
    const message = error instanceof Error ? error.message : error
    console.error(this.formatMessage('error', message, {
      ...extra,
      stack: error instanceof Error ? error.stack : undefined
    }))
  }
}

export const logger = new Logger({
  extras: {
    app: 'mic-registratie',
    version: import.meta.env.VITE_APP_VERSION
  }
})
```

### API Error Handler
```typescript
interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export const handleApiError = async (error: any): Promise<ApiErrorResponse> => {
  // Log error
  logger.error(error, { 
    tags: { type: 'api_error' },
    extra: { originalError: error }
  })

  // Map error to consistent format
  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      code: error.code,
      details: { type: 'auth_error' }
    }
  }

  if (error instanceof DatabaseError) {
    return {
      message: 'Er is een databasefout opgetreden',
      code: error.code,
      details: { type: 'db_error' }
    }
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      details: { 
        type: 'validation_error',
        fields: error.fields 
      }
    }
  }

  // Default error response
  return {
    message: 'Er is een onverwachte fout opgetreden',
    details: { type: 'unknown_error' }
  }
}
```

### Error Tracking Integration
```typescript
interface ErrorTrackingConfig {
  dsn: string;
  environment: string;
  release: string;
}

export const initializeErrorTracking = (config: ErrorTrackingConfig) => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay()
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1
    })
  }
}

export const trackError = (error: Error, extra?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.withScope(scope => {
      if (extra) {
        scope.setExtras(extra)
      }
      Sentry.captureException(error)
    })
  } else {
    logger.error(error, extra)
  }
}
``` 