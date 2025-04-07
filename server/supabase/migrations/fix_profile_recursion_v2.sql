-- Verwijder ALLE bestaande policies op de profiles tabel (zonder specifiek op naam te filteren)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END
$$;

-- Nu we zeker weten dat er geen policies meer zijn, kunnen we nieuwe toevoegen
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