# Supabase Edge Functions

Deze map bevat Edge Functions die gebruikt worden door de MIC-Registratie applicatie.

## create-user

Deze functie maakt nieuwe gebruikers aan via de Supabase Admin API.

### Benodigde omgevingsvariabelen

Voor deze functie moeten de volgende omgevingsvariabelen beschikbaar zijn in Supabase:

- `SUPABASE_URL`: De URL van je Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: De service role key (met admin rechten)

### Lokaal testen

```bash
# Navigeer naar de functions map
cd supabase/functions

# Zet de omgevingsvariabelen
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Start de functie lokaal
supabase functions serve --no-verify-jwt
```

### Deployen

```bash
# Navigeer naar de root map van het project
cd server

# Deploy de functie
supabase functions deploy create-user --no-verify-jwt
```

> **BELANGRIJK**: In productie moet je de CORS headers aanpassen om alleen verzoeken van je eigen domein toe te staan.

## Gebruik in de frontend

```typescript
// Aanroepen van de functie in de frontend
const { data, error } = await supabase.functions.invoke('create-user', {
  body: { 
    email: 'user@example.com',
    password: 'password123',
    role: 'medewerker'
  }
});
``` 