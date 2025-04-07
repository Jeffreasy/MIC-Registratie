-- Verwijder eerst alle bestaande policies op de profiles tabel
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;

-- Een simpelere aanpak zonder recursie:
-- 1. Iedereen met een geldig auth token kan profielen bekijken
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Gebruikers kunnen alleen hun eigen profiel bewerken
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Voeg speciale permissie toe voor het admin userid
-- Gebruik een directe vergelijking met IDs in plaats van rolequery
CREATE POLICY "Special admin access" ON public.profiles
  USING (auth.uid() = '7ac71eb7-a166-4a20-8855-1c89fb84a0a4' OR auth.uid() = id)
  WITH CHECK (auth.uid() = '7ac71eb7-a166-4a20-8855-1c89fb84a0a4' OR auth.uid() = id);

-- Zorg ervoor dat de huidige admin gebruiker de juiste rol heeft
UPDATE public.profiles 
SET role = 'super_admin', full_name = 'Admin Gebruiker'
WHERE id = '7ac71eb7-a166-4a20-8855-1c89fb84a0a4'; 