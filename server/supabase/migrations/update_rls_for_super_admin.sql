-- Update bestaande RLS policies om 'super_admin' toegang te geven

-- Clients policies bijwerken
ALTER POLICY "Allow admin insert access" ON public.clients
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

ALTER POLICY "Allow admin update access" ON public.clients
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

ALTER POLICY "Allow admin delete access" ON public.clients
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

-- Incident Types policies bijwerken
ALTER POLICY "Allow admin insert access" ON public.incident_types
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

ALTER POLICY "Allow admin update access" ON public.incident_types
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

ALTER POLICY "Allow admin delete access" ON public.incident_types
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Zorg ervoor dat bestaande beheerders worden bijgewerkt naar super_admin
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'beheerder'; 