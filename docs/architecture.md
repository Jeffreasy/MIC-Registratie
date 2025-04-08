# Architectuur & Setup

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
- React 18 met TypeScript
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

## Development Setup

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