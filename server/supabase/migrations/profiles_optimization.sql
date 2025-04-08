-- Optimalisatie voor de profiles tabel in Supabase

-- 1. Zorg eerst dat we eventuele bestaande constraints en policies verwijderen
DO $$ 
BEGIN
  -- Verwijder policy op clients tabel die afhankelijk is van role
  IF EXISTS (
    SELECT FROM pg_policy WHERE polname = 'Allow admin insert access on table clients'
  ) THEN
    DROP POLICY IF EXISTS "Allow admin insert access on table clients" ON public.clients;
  END IF;

  -- Verwijder eventuele andere policies die mogelijk afhankelijk zijn van role
  -- Op de profiles tabel
  DROP POLICY IF EXISTS "Profiles zijn zichtbaar voor admins" ON public.profiles;
  DROP POLICY IF EXISTS "Gebruikers kunnen alleen hun eigen profiel zien" ON public.profiles;
  DROP POLICY IF EXISTS "Alleen admins kunnen profielen aanpassen" ON public.profiles;
  DROP POLICY IF EXISTS "Alleen admins kunnen profielen verwijderen" ON public.profiles;
  DROP POLICY IF EXISTS "Alleen admins kunnen profielen toevoegen" ON public.profiles;
  
  -- Verwijder eventuele constraints
  IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

-- Verwijder eerst eventuele standaardwaarden op de role kolom
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP DEFAULT;

-- 2. Voeg een ENUM type toe voor gebruikersrollen (als deze nog niet bestaat)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('medewerker', 'super_admin');
  END IF;
END $$;

-- 3. Pas de profiles tabel aan met verbeterde constraints en indexen
ALTER TABLE public.profiles 
  -- Voeg email kolom toe als deze niet bestaat (zonder foreign key constraint)
  ADD COLUMN IF NOT EXISTS email TEXT,
  -- Verzeker NOT NULL constraints voor essentiële velden
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  -- Voeg standaard waarde voor updated_at toe
  ALTER COLUMN updated_at SET DEFAULT now();

-- 4. Converteer role naar ENUM type en stel daarna constraints in
ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'medewerker'::public.user_role;

-- 5. Voeg nuttige indexen toe
-- Index op email voor snellere lookup (users worden vaak op email gezocht)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
-- Index op role voor het filteren op rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. Voeg een Row Level Security (RLS) policy toe voor betere beveiliging
-- Alleen admins kunnen alle profielen zien
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies toevoegen
CREATE POLICY "Profiles zijn zichtbaar voor admins" 
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'::public.user_role
    )
  );

CREATE POLICY "Gebruikers kunnen alleen hun eigen profiel zien" 
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
  );

-- 7. Herstel de policy op clients tabel indien nodig
DO $$
BEGIN
  -- Als clients tabel bestaat, hermaak dan de policy met de nieuwe role type
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'clients') THEN
    CREATE POLICY "Allow admin insert access on table clients" 
      ON public.clients FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM public.profiles WHERE role = 'super_admin'::public.user_role
        )
      );
  END IF;
END $$;

-- 8. Update functie voor het bijwerken van de updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Maak trigger aan als deze nog niet bestaat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 9. Commentaren voor duidelijkheid
COMMENT ON TABLE public.profiles IS 'Profielen van gebruikers met extra informatie naast auth.users';
COMMENT ON COLUMN public.profiles.id IS 'Referentie naar auth.users.id';
COMMENT ON COLUMN public.profiles.role IS 'Rol van de gebruiker: medewerker of super_admin';
COMMENT ON COLUMN public.profiles.full_name IS 'Volledige naam van de gebruiker';
COMMENT ON COLUMN public.profiles.email IS 'E-mailadres van de gebruiker (komt overeen met auth.users.email)';
COMMENT ON COLUMN public.profiles.updated_at IS 'Tijdstip van laatste update';

-- 10. Voeg een view toe om gebruikersgegevens makkelijk te kunnen inzien
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.updated_at,
  u.email,
  u.confirmed_at,
  u.last_sign_in_at
FROM 
  public.profiles p
JOIN 
  auth.users u ON p.id = u.id;

COMMENT ON VIEW public.user_profiles IS 'Gecombineerde weergave van gebruikersprofielen met auth data'; 