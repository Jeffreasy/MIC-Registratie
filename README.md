# MIC-Registratie Applicatie

Een web-applicatie voor het registreren en beheren van MIC (Melding Incident Client) meldingen.

## Project Structuur

```
├── client/               # Frontend React applicatie
│   ├── src/
│   │   ├── lib/         # Gedeelde utilities en types
│   │   └── components/  # React componenten
│   └── vite.config.ts   # Vite configuratie
├── server/              # Backend Supabase configuratie
│   └── supabase/
│       ├── functions/   # Edge Functions
│       └── migrations/  # Database migraties
└── docs/               # Gedetailleerde documentatie
```

## Technische Stack

### Frontend
- React 18 met TypeScript
- Vite als build tool
- Supabase Client
- UI Components: Radix UI, Shadcn/ui
- Theming: next-themes
- Data visualisatie: Recharts
- Routing: React Router DOM

### Backend (Supabase)
- PostgreSQL database
- Row Level Security (RLS)
- Edge Functions
- Real-time subscriptions
- User authentication

## Documentatie

Voor gedetailleerde documentatie, zie de volgende bestanden:

- [Architectuur & Setup](docs/architecture.md) - Project structuur en setup instructies
- [Database](docs/database.md) - Database schema en migraties
- [API & Edge Functions](docs/api.md) - API endpoints en Edge Functions
- [Security](docs/security.md) - Security configuratie en policies
- [Testing](docs/testing.md) - Test configuratie en voorbeelden
- [Deployment](docs/deployment.md) - Deployment configuratie en CI/CD

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

## Environment Variables

### Frontend (client/)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Edge Functions
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key voor admin operaties 