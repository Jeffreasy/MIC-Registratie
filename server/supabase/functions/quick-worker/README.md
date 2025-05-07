# Quick Worker Edge Function

Deze Edge Function is verantwoordelijk voor het snel resetten van wachtwoorden in de MIC-Registratie applicatie.

## Functionaliteit

De functie maakt gebruik van de Supabase Admin API om:

1. Een gebruiker op te zoeken op basis van email
2. Het wachtwoord van de gebruiker te resetten naar een nieuw wachtwoord

## Vereiste Omgevingsvariabelen

- `SUPABASE_URL`: De URL van je Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: De service role key met admin rechten

## API Documentatie

### Endpoint

`POST https://[jouw-project].supabase.co/functions/v1/quick-worker`

### Request Body

```json
{
  "email": "gebruiker@sheerenloo.nl",
  "newPassword": "nieuw_wachtwoord"
}
```

### Succesvolle Response

```json
{
  "success": true,
  "message": "Wachtwoord succesvol gereset"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Beschrijving van de fout"
}
```

## Beveiliging

Deze functie heeft admin rechten nodig om wachtwoorden te resetten. Het is belangrijk dat:

1. De service role key nooit wordt blootgesteld aan de client
2. De CORS headers worden beperkt tot alleen de toegestane domeinen in productie
3. De functie alleen toegankelijk is voor ingelogde gebruikers met admin rol

## Deployment

### Via Supabase Dashboard

1. Navigeer naar de Edge Functions tab in het Supabase dashboard
2. Maak een nieuwe functie of update de bestaande 'quick-worker' functie
3. Kopieer de code uit `index.ts`
4. Voeg de vereiste omgevingsvariabelen toe in de instellingen

### Via Command Line (met Supabase CLI)

```bash
# Navigeer naar de root map van het project
cd server

# Deploy de functie
supabase functions deploy quick-worker --no-verify-jwt
```

## Testen

```bash
# Lokaal testen (met Supabase CLI)
supabase functions serve quick-worker --no-verify-jwt

# Test met curl
curl -X POST 'http://localhost:54321/functions/v1/quick-worker' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","newPassword":"nieuw_wachtwoord"}'
``` 