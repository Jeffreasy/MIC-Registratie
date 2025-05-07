# MIC-Registratie Applicatie

Een web-applicatie voor het registreren en beheren van MIC (Melding Incident Client) meldingen.

## Project Structuur

```
├── client/               # Frontend React applicatie
│   ├── src/
│   │   ├── lib/         # Gedeelde utilities en types
│   │   └── components/  # React componenten
│   └── vite.config.ts   # Vite configuratie
└── server/              # Backend Supabase configuratie
    └── supabase/
        ├── functions/   # Edge Functions
        └── migrations/  # Database migraties
```

## Technische Stack

### Frontend
- React 18 met TypeScript  # Correctie van React versie
- Vite als build tool
- Supabase Client (^2.49.4)
- UI Components:
  - Radix UI primitives
  - Shadcn/ui componenten (New York style)
  - Lucide React icons
- Theming: next-themes voor dark/light mode support
- Data visualisatie: Recharts (^2.15.2)
- Routing: React Router DOM (^6.30.0)

### Backend (Supabase)
- PostgreSQL database
- Row Level Security (RLS)
- Edge Functions voor serverless operaties
- Real-time subscriptions
- User authentication

## Core Features

### Gebruikersbeheer
- Rollen systeem:
  - `medewerker`
  - `super_admin`
- Profielbeheer met Row Level Security
- Geautomatiseerde gebruikersregistratie via Edge Functions

### Database Schema
- `profiles`: Gebruikersprofielen gekoppeld aan auth.users
- `clients`: Cliëntgegevens
- `incident_types`: Configureerbare incident categorieën
- `incident_logs`: Incident registraties

### Security
- Row Level Security (RLS) policies voor data toegang
- Role-based access control
- Secure authentication via Supabase Auth

## Database Types

### Tables

#### Clients
```typescript
{
  Row: {
    id: string
    full_name: string
    is_active: boolean
    created_at: string
  }
  Insert: {
    id?: string
    full_name: string
    is_active?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    full_name?: string
    is_active?: boolean
    created_at?: string
  }
}
```

#### Incident Logs
```typescript
{
  Row: {
    id: string
    user_id: string
    client_id: string
    incident_type_id: string
    description: string
    severity: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    client_id: string
    incident_type_id: string
    description: string
    severity: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    client_id?: string
    incident_type_id?: string
    description?: string
    severity?: number
    created_at?: string
    updated_at?: string
  }
}
```

#### Incident Types
```typescript
{
  Row: {
    id: string
    name: string
    category: string
    description: string | null
    created_at: string
  }
  Insert: {
    id?: string
    name: string
    category: string
    description?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    name?: string
    category?: string
    description?: string | null
    created_at?: string
  }
}
```

### Views

#### Daily Totals
```typescript
{
  Row: {
    user_id: string
    client_id: string
    log_date: string
    incident_type_id: number
    category: string | null
    total_count: number
  }
}
```

#### Monthly Summary
```typescript
{
  Row: {
    month: string
    user_id: string
    incident_type_id: number
    category: string | null
    unique_clients: number
    total_incidents: number
  }
}
```

### Extended Types

#### IncidentLogWithRelations
```typescript
{
  id: number;
  created_at: string;
  log_date: string;
  user_id: string;
  count: number;
  notes: string | null;
  location: string | null;
  severity: number | null;
  time_of_day: string | null;
  triggered_by: string | null;
  intervention_successful: boolean;
  client: {
    full_name: string;
  };
  incident_type: {
    name: string;
    category: string | null;
    severity_level: number | null;
    color_code: string | null;
    requires_notification: boolean;
  };
  client_id?: string;
  incident_type_id?: number;
  combinedLogIds?: number[];
}
```

### User Types

```typescript
type UserRole = 'medewerker' | 'super_admin';

interface UserProfile {
  id: string;
  email?: string | null;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
}
```

## Database Structuur

### Materialized Views
```sql
CREATE MATERIALIZED VIEW daily_totals AS
SELECT 
  user_id, 
  client_id,
  log_date, 
  incident_type_id,
  incident_types.category,
  SUM(count) as total_count
FROM public.incident_logs
JOIN public.incident_types ON public.incident_logs.incident_type_id = public.incident_types.id
GROUP BY user_id, client_id, log_date, incident_type_id, public.incident_types.category;
```

### Database Triggers
```sql
CREATE OR REPLACE FUNCTION refresh_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row Level Security Policies

#### Clients Table
```sql
CREATE POLICY "Allow authenticated read access" 
  ON public.clients FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin insert access" 
  ON public.clients FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));
```

#### Profiles Table
```sql
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');
```

## Supabase Implementatie

### Client Configuratie
```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'mic-registratie'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### Real-time Subscriptions
```typescript
export const subscribeToTable = (
  tableName: 'incident_logs' | 'clients' | 'incident_types',
  callback: (payload: RealtimePostgresChangesPayload<Record<string, any>>) => void
) => {
  return supabase
    .channel(`table-changes:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => callback(payload)
    )
    .subscribe()
}
```

### Environment Variables
Required environment variables in `.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Connection Validation
```typescript
void (async () => {
  try {
    await supabase.from('profiles').select('count', { count: 'exact', head: true })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Supabase verbindingsfout:', error)
    }
  }
})()
```

### Development Mode Features
```typescript
if (import.meta.env.DEV) {
  window.supabase = supabase
}
```

## API Integratie

### Register Edge Function
Endpoint: `POST /functions/v1/Register`
```typescript
{
  email: string;
  password: string;
  role: "medewerker" | "super_admin";
}
```

## Development

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Supabase Edge Functions
```bash
cd server/supabase/functions
supabase functions serve --no-verify-jwt
```

### Database Migraties

### Profiles Table Setup
```sql
-- Enum type voor gebruikersrollen
CREATE TYPE public.user_role AS ENUM ('medewerker', 'super_admin');  -- Niet 'beheerder'

-- Profiles tabel structuur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'medewerker'::public.user_role,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT
);

-- Gecombineerde view voor gebruikersgegevens
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.updated_at AS profile_updated_at,
  u.email,                           
  u.created_at AS user_created_at,   
  u.confirmed_at,
  u.last_sign_in_at
FROM 
  public.profiles p
JOIN 
  auth.users u ON p.id = u.id;
```

### Row Level Security Policies
```sql
-- Basis toegangsbeleid
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Super admin toegang
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Clients policies
ALTER POLICY "Allow admin insert access" ON public.clients
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

ALTER POLICY "Allow admin update access" ON public.clients
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));
```

### Database Optimizations
```sql
-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Automatische timestamp updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- NOT NULL constraints
ALTER TABLE public.profiles 
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;
```

### Migratie Volgorde
1. `remove_policies.sql`: Verwijder bestaande policies
2. `alter_role_only.sql`: Wijzig role kolom naar ENUM type
3. `other_optimizations.sql`: Voeg optimalisaties toe

```bash
# Uitvoeren van migraties
supabase db reset    # Voor lokale ontwikkeling
supabase db push     # Voor productie updates
```

## Environment Variables

### Frontend (client/)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Edge Functions
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key voor admin operaties

## Deployment

### Frontend
- Geconfigureerd voor Vercel deployment
- Custom routing via vercel.json
- Build command: `tsc -b && vite build`

### Edge Functions
Deploy via Supabase CLI:
```bash
supabase functions deploy Register --no-verify-jwt
```

## Edge Functions

### Register Function Implementation
```typescript
interface CreateUserRequest {
  email: string;
  password: string;
  role: 'medewerker' | 'super_admin';
}

interface CreateUserResponse {
  success: boolean;
  userId?: string;
  message?: string;
}

// CORS headers configuratie
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Supabase Admin Client configuratie
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

### User Creation Implementation
```typescript
const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    role
  }
})

// Profile Update Implementation
const { error: insertError } = await supabaseAdmin
  .from('profiles')
  .upsert({ 
    id: user.user.id, 
    role: role,
    email: email,
    full_name: null,
    updated_at: new Date().toISOString()
  })
```

### Edge Function Deployment
```bash
# Via Supabase CLI
supabase functions deploy Register --no-verify-jwt

# Lokaal testen
supabase functions serve Register --no-verify-jwt
```

### Edge Function Environment Variables
```bash
# Required environment variables
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Edge Function Testing
```bash
# Test met curl
curl -X POST 'http://localhost:54321/functions/v1/Register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","role":"medewerker"}'
```

### Client-side Function Invocation
```typescript
const { data, error } = await supabase.functions.invoke('Register', {
  body: { 
    email: 'user@example.com',
    password: 'password123',
    role: 'medewerker'
  }
})
```

## Materialized Views en Triggers

### Daily Totals View
```sql
CREATE MATERIALIZED VIEW daily_totals AS
SELECT 
  user_id, 
  client_id,
  log_date, 
  incident_type_id,
  incident_types.category,
  SUM(count) as total_count
FROM public.incident_logs
JOIN public.incident_types ON public.incident_logs.incident_type_id = public.incident_types.id
GROUP BY user_id, client_id, log_date, incident_type_id, public.incident_types.category;

-- Index voor snellere queries
CREATE INDEX daily_totals_user_date_idx ON daily_totals(user_id, log_date);
CREATE INDEX daily_totals_client_date_idx ON daily_totals(client_id, log_date);
```

### Monthly Summary View
```sql
CREATE MATERIALIZED VIEW monthly_summary AS
SELECT 
  TO_CHAR(log_date, 'YYYY-MM') as month,
  user_id,
  incident_type_id,
  incident_types.category,
  COUNT(DISTINCT client_id) as unique_clients,
  SUM(count) as total_incidents
FROM public.incident_logs
JOIN public.incident_types ON public.incident_logs.incident_type_id = public.incident_types.id
GROUP BY 
  TO_CHAR(log_date, 'YYYY-MM'),
  user_id,
  incident_type_id,
  incident_types.category;

-- Index voor snellere queries
CREATE INDEX monthly_summary_user_month_idx ON monthly_summary(user_id, month);
```

### Automatische Refresh Triggers
```sql
-- Trigger functie voor het verversen van materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_totals;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger voor incident_logs tabel
CREATE TRIGGER refresh_mat_views_after_incident_change
    AFTER INSERT OR UPDATE OR DELETE
    ON public.incident_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_materialized_views();
```

### Timestamp Update Triggers
```sql
-- Functie voor het automatisch updaten van updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger voor profiles tabel
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger voor incident_logs tabel
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Notification Triggers
```sql
-- Trigger functie voor notificaties bij hoge ernst incidenten
CREATE OR REPLACE FUNCTION notify_high_severity_incident()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity >= 8 THEN
        PERFORM pg_notify(
            'high_severity_incident',
            json_build_object(
                'incident_id', NEW.id,
                'client_id', NEW.client_id,
                'severity', NEW.severity,
                'created_at', NEW.created_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger voor incident_logs tabel
CREATE TRIGGER notify_high_severity
    AFTER INSERT
    ON public.incident_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_high_severity_incident();
```

## Realtime Subscriptions en Websocket Handlers

### Realtime Channel Setup
```typescript
export const subscribeToTable = (
  tableName: 'incident_logs' | 'clients' | 'incident_types',
  callback: (payload: RealtimePostgresChangesPayload<Record<string, any>>) => void
) => {
  return supabase
    .channel(`table-changes:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => callback(payload)
    )
    .subscribe()
}
```

### High Severity Incident Subscription
```typescript
const subscribeToHighSeverityIncidents = () => {
  return supabase
    .channel('high-severity-incidents')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'incident_logs',
        filter: 'severity=gte.8'
      },
      (payload) => handleHighSeverityIncident(payload)
    )
    .subscribe()
}

const handleHighSeverityIncident = async (payload: RealtimePostgresChangesPayload<IncidentLog>) => {
  const { new: incident } = payload
  
  // Notificatie versturen
  await supabase.functions.invoke('send-notification', {
    body: { 
      incidentId: incident.id,
      severity: incident.severity,
      clientId: incident.client_id
    }
  })
}
```

### Client-side Usage Example
```typescript
// In een React component
useEffect(() => {
  // Subscribe to incident_logs table changes
  const subscription = subscribeToTable('incident_logs', (payload) => {
    if (payload.eventType === 'INSERT') {
      // Update local state
      setIncidents(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE') {
      // Update specific incident in local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === payload.new.id ? payload.new : incident
        )
      )
    } else if (payload.eventType === 'DELETE') {
      // Remove incident from local state
      setIncidents(prev => 
        prev.filter(incident => incident.id !== payload.old.id)
      )
    }
  })

  // Cleanup subscription on unmount
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

### Broadcast Channel Implementation
```typescript
// Broadcast channel voor real-time updates tussen tabs
const broadcastChannel = new BroadcastChannel('incident-updates')

export const setupBroadcastListeners = () => {
  broadcastChannel.onmessage = (event) => {
    const { type, data } = event.data
    
    switch (type) {
      case 'NEW_INCIDENT':
        handleNewIncident(data)
        break
      case 'UPDATE_INCIDENT':
        handleIncidentUpdate(data)
        break
      case 'DELETE_INCIDENT':
        handleIncidentDelete(data)
        break
    }
  }
}

export const broadcastIncidentUpdate = (type: string, data: any) => {
  broadcastChannel.postMessage({ type, data })
}
```

### Presence Channel for Online Users
```typescript
const presenceChannel = supabase.channel('online-users', {
  config: {
    presence: {
      key: currentUser.id
    }
  }
})

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    setOnlineUsers(Object.keys(state))
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    setOnlineUsers(prev => [...prev, key])
  })
  .on('presence', { event: 'leave' }, ({ key }) => {
    setOnlineUsers(prev => prev.filter(id => id !== key))
  })
  .subscribe()
```

### Error Handling and Reconnection
```typescript
const setupRealtimeClient = () => {
  supabase.realtime.onError((error) => {
    console.error('Realtime error:', error)
    // Implement exponential backoff
    setTimeout(() => {
      supabase.realtime.connect()
    }, getBackoffDelay())
  })

  supabase.realtime.onDisconnect(() => {
    console.log('Disconnected from realtime service')
    // Attempt to reconnect
    supabase.realtime.connect()
  })
}

const getBackoffDelay = (() => {
  let attempt = 0
  const maxDelay = 30000 // 30 seconds
  const baseDelay = 1000 // 1 second

  return () => {
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt))
    attempt++
    return delay
  }
})()
```

## Authentication en User Management

### Auth Store Setup
```typescript
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user: User | null) => set({ user }),
  setProfile: (profile: UserProfile | null) => set({ profile }),
  setLoading: (isLoading: boolean) => set({ isLoading })
}))

// Auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    useAuthStore.setState({ 
      user: session.user,
      profile,
      isLoading: false
    })
  } else {
    useAuthStore.setState({ 
      user: null,
      profile: null,
      isLoading: false
    })
  }
})
```

### Authentication Functions
```typescript
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, role: UserRole = 'medewerker') {
    const { data: functionData, error: functionError } = await supabase
      .functions.invoke('Register', {
        body: { email, password, role }
      })
    
    if (functionError) throw functionError
    if (!functionData.success) throw new Error(functionData.message)
    
    return functionData
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
```

### Protected Route Component
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, profile, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true })
    }

    if (!isLoading && user && requiredRole && profile) {
      if (!requiredRole.includes(profile.role)) {
        navigate('/', { replace: true })
      }
    }
  }, [user, profile, isLoading, navigate, requiredRole])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}
```

### User Profile Management
```typescript
export const profileService = {
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user:auth.users(
          email,
          created_at,
          last_sign_in_at
        )
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user:auth.users(
          email,
          created_at,
          last_sign_in_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
```

### Role-based Access Control Hook
```typescript
interface UseRoleAccessProps {
  requiredRole?: UserRole[];
  fallback?: React.ReactNode;
}

const useRoleAccess = ({ requiredRole, fallback = null }: UseRoleAccessProps) => {
  const { profile } = useAuthStore()

  if (!profile || !requiredRole) {
    return false
  }

  const hasAccess = requiredRole.includes(profile.role)

  return {
    hasAccess,
    render: (children: React.ReactNode) => hasAccess ? children : fallback
  }
}

// Usage example
const AdminButton = () => {
  const { render } = useRoleAccess({ 
    requiredRole: ['super_admin'],
    fallback: <AccessDenied /> 
  })

  return render(
    <Button onClick={handleAdminAction}>
      Admin Action
    </Button>
  )
}
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

### Custom Hook voor Error Handling
```typescript
interface UseErrorHandlingProps {
  onError?: (error: Error) => void;
}

const useErrorHandling = ({ onError }: UseErrorHandlingProps = {}) => {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: Error) => {
    setError(error)
    onError?.(error)
    trackError(error)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const wrapAsync = useCallback(async <T,>(
    promise: Promise<T>,
    errorMessage = 'Er is een fout opgetreden'
  ): Promise<T> => {
    try {
      setIsLoading(true)
      const result = await promise
      return result
    } catch (error) {
      const wrappedError = new Error(
        error instanceof Error ? error.message : errorMessage
      )
      handleError(wrappedError)
      throw wrappedError
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  return {
    error,
    isLoading,
    clearError,
    wrapAsync,
    handleError
  }
}
```

## Testing Configuration

### Jest Setup
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Test Utilities
```typescript
// src/utils/test-utils.tsx
import { render as rtlRender } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const mockSupabaseClient = createClient('mock-url', 'mock-key')

export function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
```

### Mock Service Worker Setup
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.post('/functions/v1/Register', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        userId: 'mock-user-id'
      })
    )
  }),

  rest.get('/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: 'mock-id',
            email: 'test@example.com',
            role: 'medewerker'
          }
        ]
      })
    )
  })
]
```

### Example Test Cases
```typescript
// src/components/Auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('validates required fields', async () => {
    render(<LoginForm onSubmit={jest.fn()} />)
    
    fireEvent.click(screen.getByRole('button', { name: /inloggen/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/email is verplicht/i)).toBeInTheDocument()
      expect(screen.getByText(/wachtwoord is verplicht/i)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with form data', async () => {
    const mockOnSubmit = jest.fn()
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/wachtwoord/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /inloggen/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})
```

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

### Vercel Configuration
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

### Supabase CLI Configuration
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

### Database Migration Script
```sql
-- supabase/migrations/20230901000000_initial_schema.sql
create type user_role as enum ('medewerker', 'super_admin');

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role user_role not null default 'medewerker',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;

create policy "Profiles are viewable by users who created them."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
```

### End-to-End Tests with Cypress
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should login successfully', () => {
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('password123')
    cy.get('[data-cy=login-button]').click()

    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-menu]').should('be.visible')
  })

  it('should show error on invalid credentials', () => {
    cy.get('[data-cy=email-input]').type('wrong@example.com')
    cy.get('[data-cy=password-input]').type('wrongpass')
    cy.get('[data-cy=login-button]').click()

    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Ongeldige inloggegevens')
  })
})
```

## Security Configuration

### Content Security Policy
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

### Rate Limiting Edge Function
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

### Row Level Security Policies
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

-- Complete table definitions
CREATE TABLE public.incident_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    category VARCHAR(50) CHECK (category IN ('fysiek', 'verbaal', 'emotioneel', 'sociaal')),
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 10),
    requires_notification BOOLEAN DEFAULT false,
    color_code VARCHAR(7)
);

CREATE TABLE public.incident_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    client_id UUID REFERENCES public.clients(id),
    incident_type_id INTEGER REFERENCES public.incident_types(id),
    log_date DATE DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```
