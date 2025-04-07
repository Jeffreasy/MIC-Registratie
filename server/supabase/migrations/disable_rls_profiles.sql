-- Verwijder eerst eventuele bestaande policies op de profiles tabel
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;

-- Maak profiles toegankelijk voor alle geauthenticeerde gebruikers
-- Dit is een simpele maar effectieve oplossing
CREATE POLICY "Enable read access for all authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Super admins kunnen alle profielen wijzigen
CREATE POLICY "Super admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR auth.uid() = id)
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR auth.uid() = id);

-- Super admins kunnen nieuwe profielen toevoegen
CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Enable RLS op de profiles tabel (voor het geval deze was uitgeschakeld)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Zorg ervoor dat de huidige admin gebruiker de juiste rol heeft
UPDATE public.profiles 
SET role = 'super_admin', full_name = 'Admin Gebruiker'
WHERE id = '7ac71eb7-a166-4a20-8855-1c89fb84a0a4';

-- Creëer een functie die direct de rol van een gebruiker kan ophalen
-- Dit omzeilt eventuele RLS-beperkingen
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 