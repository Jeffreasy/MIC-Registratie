# API & Edge Functions Documentatie

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

## Realtime Subscriptions

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

## Authentication API

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