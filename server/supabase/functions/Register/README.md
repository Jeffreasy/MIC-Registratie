# Register Edge Function

Deze Edge Function is verantwoordelijk voor het veilig aanmaken van nieuwe gebruikers in de MIC-Registratie applicatie.

## Functionaliteit

De functie maakt gebruik van de Supabase Admin API om:

1. Een nieuwe gebruiker aan te maken in `auth.users`
2. De gebruiker direct te bevestigen (email_confirm = true)
3. Een bijbehorend profiel aan te maken in de `profiles` tabel
4. De juiste rol toe te wijzen

## Vereiste Omgevingsvariabelen

- `SUPABASE_URL`: De URL van je Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: De service role key met admin rechten

## API Documentatie

### Endpoint

`POST https://[jouw-project].supabase.co/functions/v1/Register`

### Request Body

```json
{
  "email": "gebruiker@sheerenloo.nl",
  "password": "tijdelijk_wachtwoord",
  "role": "medewerker"  // "medewerker" of "super_admin"
}
```

### Succesvolle Response

```json
{
  "success": true,
  "userId": "uuid-van-nieuwe-gebruiker"
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

Deze functie heeft admin rechten nodig om gebruikers aan te maken. Het is belangrijk dat:

1. De service role key nooit wordt blootgesteld aan de client
2. De CORS headers worden beperkt tot alleen de toegestane domeinen in productie
3. De functie alleen toegankelijk is voor ingelogde gebruikers met admin rol

## Deployment

### Via Supabase Dashboard

1. Navigeer naar de Edge Functions tab in het Supabase dashboard
2. Maak een nieuwe functie of update de bestaande 'Register' functie
3. Kopieer de code uit `index.ts`
4. Voeg de vereiste omgevingsvariabelen toe in de instellingen

### Via Command Line (met Supabase CLI)

```bash
# Navigeer naar de root map van het project
cd server

# Deploy de functie
supabase functions deploy Register --no-verify-jwt
```

## Testen

```bash
# Lokaal testen (met Supabase CLI)
supabase functions serve Register --no-verify-jwt

# Test met curl
curl -X POST 'http://localhost:54321/functions/v1/Register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","role":"medewerker"}'
``` 