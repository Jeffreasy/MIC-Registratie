-- Script voor de overige optimalisaties van de profiles tabel

-- Zorg ervoor dat het juiste schema wordt gebruikt
SET search_path TO public; 

-- 1. Voeg email kolom toe (Overweeg nut/redundantie tov auth.users.email)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Verzeker NOT NULL constraints en default voor essentiële velden
ALTER TABLE public.profiles 
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET NOT NULL;
  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();
    RAISE NOTICE 'Default voor updated_at ingesteld.';
  ELSE
    RAISE NOTICE 'Default voor updated_at bestond al.';
  END IF;
END $$;

-- 3. Voeg nuttige indexen toe
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. Maak trigger functie voor automatische updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Maak trigger aan als deze nog niet bestaat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_profiles_updated_at' 
    AND tgrelid = 'public.profiles'::regclass 
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
    RAISE NOTICE 'Trigger set_profiles_updated_at aangemaakt.';
  ELSE
      RAISE NOTICE 'Trigger set_profiles_updated_at bestond al.';
  END IF;
END $$;

-- 5. Voeg Row Level Security toe (indien nog niet actief)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Maak SELECT policies aan 
DROP POLICY IF EXISTS "Profiles zijn zichtbaar voor admins" ON public.profiles;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen hun eigen profiel zien" ON public.profiles;

CREATE POLICY "Profiles zijn zichtbaar voor admins" 
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Gebruikers kunnen alleen hun eigen profiel zien" 
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
  );

-- BELANGRIJK: Voeg hier policies toe voor INSERT, UPDATE, DELETE!
DROP POLICY IF EXISTS "Gebruikers kunnen hun eigen profiel bijwerken" ON public.profiles;
CREATE POLICY "Gebruikers kunnen hun eigen profiel bijwerken"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id ) 
  WITH CHECK ( auth.uid() = id );

-- DROP POLICY IF EXISTS "Ingelogde gebruikers kunnen een profiel voor zichzelf aanmaken" ON public.profiles;
-- CREATE POLICY "Ingelogde gebruikers kunnen een profiel voor zichzelf aanmaken"
--   ON public.profiles FOR INSERT
--   WITH CHECK ( auth.uid() = id );


-- 7. Voeg commentaren toe voor duidelijkheid
COMMENT ON TABLE public.profiles IS 'Profielen van gebruikers met extra informatie naast auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Referentie naar auth.users.id (Primary Key & Foreign Key).';
COMMENT ON COLUMN public.profiles.role IS 'Rol van de gebruiker binnen de applicatie (bijv. medewerker, super_admin).';
COMMENT ON COLUMN public.profiles.full_name IS 'Volledige naam van de gebruiker.';
COMMENT ON COLUMN public.profiles.email IS 'E-mailadres van de gebruiker (idealiter gesynchroniseerd of gelijk aan auth.users.email). Overweeg noodzaak.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Tijdstip waarop het profiel voor het laatst is bijgewerkt.';

-- 8. Maak view voor makkelijke toegang tot gecombineerde gebruikersgegevens
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

COMMENT ON VIEW public.user_profiles IS 'Gecombineerde weergave van gebruikersprofielen (public.profiles) en authenticatie data (auth.users). RLS van public.profiles is van toepassing.';

-- EINDE VAN HET SCRIPT