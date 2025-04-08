-- Script om de profiles tabel opnieuw aan te maken
SET search_path TO public;

-- 1. Zorg ervoor dat het ENUM type bestaat
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'ENUM type user_role aanmaken...';
    CREATE TYPE public.user_role AS ENUM ('medewerker', 'super_admin');
  ELSE
    RAISE NOTICE 'ENUM type user_role bestaat al.';
  END IF;
END $$;

-- 2. Maak de profiles tabel opnieuw aan
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'medewerker'::public.user_role,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT
);

-- 3. Voeg indexes toe
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Maak trigger voor automatische timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Maak trigger aan
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Schakel RLS in en voeg policies toe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Selectie policies
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

-- Update policy
CREATE POLICY "Gebruikers kunnen hun eigen profiel bijwerken"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id ) 
  WITH CHECK ( auth.uid() = id );

-- 6. Voeg oorspronkelijke data weer toe
INSERT INTO public.profiles (id, updated_at, full_name, role)
VALUES 
  ('3d307d16-7d69-4f77-a2e5-e5be6dd5d65a', '2025-04-07 21:16:50+00', 'Floris', 'medewerker'), 
  ('799824f9-33bb-4997-98de-12873734dcce', '2025-04-07 21:16:53+00', 'Kees', 'medewerker'), 
  ('7ac71eb7-a166-4a20-8855-1c89fb84a0a4', '2025-04-07 21:16:55+00', 'Jeffrey', 'super_admin'), 
  ('8da0ddfe-b445-48d9-a1bb-385766e170b5', '2025-04-07 21:16:58+00', 'Lauri', 'medewerker'), 
  ('f70290f3-86f6-43b4-923e-4a6cbec24b65', '2025-04-07 21:17:00+00', 'test', 'medewerker')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = EXCLUDED.updated_at;

-- 7. Verbind eventueel bestaande auth.users die geen profiel hebben
-- Dit kan nuttig zijn als er al accounts bestaan die nog geen profiel hebben
INSERT INTO public.profiles (id, role, full_name, email)
SELECT 
  u.id, 
  'medewerker'::public.user_role, 
  u.raw_user_meta_data->>'full_name', 
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 8. Commentaar toevoegen
COMMENT ON TABLE public.profiles IS 'Profielen van gebruikers met extra informatie naast auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Referentie naar auth.users.id (Primary Key & Foreign Key).';
COMMENT ON COLUMN public.profiles.role IS 'Rol van de gebruiker binnen de applicatie (bijv. medewerker, super_admin).';
COMMENT ON COLUMN public.profiles.full_name IS 'Volledige naam van de gebruiker.';
COMMENT ON COLUMN public.profiles.email IS 'E-mailadres van de gebruiker (idealiter gesynchroniseerd of gelijk aan auth.users.email).';
COMMENT ON COLUMN public.profiles.updated_at IS 'Tijdstip waarop het profiel voor het laatst is bijgewerkt.';

-- 9. Maak view voor makkelijke toegang tot gecombineerde gebruikersgegevens
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

-- Eindmelding
DO $$
BEGIN
  RAISE NOTICE 'Profiles tabel is succesvol hersteld!';
END $$;

-- EINDE VAN HET SCRIPT 