# Supabase Configuratie

Deze map bevat alle configuratie, migraties en serverless functies voor Supabase.

## Mappen

- `functions`: Edge Functions voor serverless operaties
- `migrations`: SQL migraties voor database schema aanpassingen

## Migraties

De migratie voor de `profiles` tabel moet in drie stappen worden uitgevoerd om problemen met bestaande policies te vermijden:

### 1. remove_policies.sql

Dit script verwijdert alle policies die afhankelijk zijn van de 'role' kolom in zowel de clients als profiles tabel. Dit moet worden uitgevoerd voordat het type van de kolom kan worden gewijzigd.

### 2. alter_role_only.sql

Dit script wijzigt het type van de 'role' kolom naar een ENUM type ('user_role') door:
- Een nieuwe kolom aan te maken met het ENUM type
- De data te kopiëren en te converteren
- De oude kolom te verwijderen en de nieuwe kolom te hernoemen

### 3. other_optimizations.sql

Dit script voegt de overige optimalisaties toe:
- Indexes voor betere performance
- NOT NULL constraints voor gegevensintegriteit
- Automatische timestamp updates via triggers
- Row Level Security voor betere beveiliging
- Een view voor eenvoudige toegang tot gebruikersgegevens

### Uitvoeren van migraties

Om migraties uit te voeren in de juiste volgorde:

```bash
# In SQL Editor, voer de scripts uit in deze volgorde:
1. remove_policies.sql
2. alter_role_only.sql
3. other_optimizations.sql
```

## Edge Functions

### Register

De `Register` edge function maakt nieuwe gebruikers aan via de Admin API.

Voor details over het deployen van deze functie, zie het bestand in `functions/Register/README.md`. 