-- Verwijder eventueel bestaande conflicterende policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;

-- Maak nieuwe policies
-- Elke gebruiker kan zijn eigen profiel zien
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Super admins kunnen alle profielen zien
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Super admins kunnen alle profielen bijwerken
CREATE POLICY "Super admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Als tijdelijke workaround, schakel RLS uit voor de profiles tabel
-- LET OP: Dit is alleen voor test doeleinden, niet voor productie!
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Update je profiel direct om te testen
UPDATE public.profiles 
SET role = 'super_admin', full_name = 'Admin Gebruiker'
WHERE id = '7ac71eb7-a166-4a20-8855-1c89fb84a0a4'; 