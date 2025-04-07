-- ============================================================================
-- COMPLETE SUPABASE SQL SETUP SCRIPT
-- ============================================================================

-- ============================================================================
-- Fase 1: Database Schema Definitie - Tabellen
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabel: clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  is_active boolean DEFAULT true NOT NULL
);

COMMENT ON TABLE public.clients IS 'Tabel voor het opslaan van cliëntgegevens.';
COMMENT ON COLUMN public.clients.full_name IS 'Volledige naam van de cliënt.';
COMMENT ON COLUMN public.clients.date_of_birth IS 'Geboortedatum van de cliënt.';
COMMENT ON COLUMN public.clients.is_active IS 'Geeft aan of het cliëntprofiel actief is.';

-- ----------------------------------------------------------------------------
-- Tabel: incident_types met categorieën en severity
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_types (
  id bigserial PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  category TEXT CHECK (category IN ('fysiek', 'verbaal', 'emotioneel', 'sociaal')),
  severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
  requires_notification BOOLEAN DEFAULT false,
  color_code TEXT
);

COMMENT ON TABLE public.incident_types IS 'Tabel voor de verschillende soorten incidenten die geregistreerd kunnen worden.';
COMMENT ON COLUMN public.incident_types.name IS 'De naam van het incident type (bv. Bonken, Slaan).';
COMMENT ON COLUMN public.incident_types.description IS 'Optionele beschrijving van het incident type.';
COMMENT ON COLUMN public.incident_types.is_active IS 'Geeft aan of dit incident type actief gebruikt wordt.';
COMMENT ON COLUMN public.incident_types.category IS 'Categorie van het incident type (fysiek, verbaal, emotioneel, sociaal).';
COMMENT ON COLUMN public.incident_types.severity_level IS 'Ernst-niveau van het incident type (1-5).';
COMMENT ON COLUMN public.incident_types.requires_notification IS 'Geeft aan of er melding gemaakt moet worden bij dit incident type.';
COMMENT ON COLUMN public.incident_types.color_code IS 'Optionele kleurcode voor weergave in de UI.';

-- ----------------------------------------------------------------------------
-- Tabel: profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamp with time zone,
  full_name text,
  role text DEFAULT 'medewerker'::text NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Tabel voor aanvullende gebruikersprofielinformatie, gekoppeld aan auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Referentie naar de id in auth.users.';
COMMENT ON COLUMN public.profiles.full_name IS 'Volledige naam van de medewerker.';
COMMENT ON COLUMN public.profiles.role IS 'Rol van de gebruiker binnen de applicatie (bv. medewerker, beheerder).';

-- ----------------------------------------------------------------------------
-- Functie & Trigger: handle_new_user (voor automatisch profiel aanmaken)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Tabel: incident_logs met uitgebreide velden
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_logs (
  id bigserial PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  incident_type_id bigint NOT NULL REFERENCES public.incident_types(id),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1 CHECK (count > 0),
  notes text,
  location TEXT,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  time_of_day TIME,
  triggered_by TEXT,
  intervention_successful BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.incident_logs IS 'Centrale tabel voor het loggen van incidenten.';
COMMENT ON COLUMN public.incident_logs.user_id IS 'ID van de medewerker (uit auth.users) die de log heeft aangemaakt.';
COMMENT ON COLUMN public.incident_logs.client_id IS 'ID van de cliënt waarvoor de log is.';
COMMENT ON COLUMN public.incident_logs.incident_type_id IS 'ID van het type incident.';
COMMENT ON COLUMN public.incident_logs.log_date IS 'De datum waarop het incident (of de incidenten) plaatsvond(en).';
COMMENT ON COLUMN public.incident_logs.count IS 'Het aantal keer dat het incident is voorgevallen (minimaal 1).';
COMMENT ON COLUMN public.incident_logs.notes IS 'Eventuele extra notities bij de registratie.';
COMMENT ON COLUMN public.incident_logs.location IS 'Locatie waar het incident plaatsvond.';
COMMENT ON COLUMN public.incident_logs.severity IS 'Ernst-niveau van het specifieke incident (1-5).';
COMMENT ON COLUMN public.incident_logs.time_of_day IS 'Tijd waarop het incident plaatsvond.';
COMMENT ON COLUMN public.incident_logs.triggered_by IS 'Wat het incident heeft veroorzaakt.';
COMMENT ON COLUMN public.incident_logs.intervention_successful IS 'Geeft aan of de interventie succesvol was.';

-- ----------------------------------------------------------------------------
-- Indexen (voor performance)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_incident_logs_client_date ON public.incident_logs (client_id, log_date);
CREATE INDEX IF NOT EXISTS idx_incident_logs_user_id ON public.incident_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_type_id ON public.incident_logs (incident_type_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_user_date ON public.incident_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_incident_logs_client ON public.incident_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_type ON public.incident_logs (incident_type_id);

-- ============================================================================
-- Fase 2: Views en Materialized Views
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Materialized View: daily_totals 
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.daily_totals;
CREATE MATERIALIZED VIEW public.daily_totals AS
SELECT 
  user_id, 
  client_id,
  log_date, 
  incident_type_id,
  incident_types.category,
  SUM(count) as total_count
FROM public.incident_logs
JOIN public.incident_types ON public.incident_logs.incident_type_id = public.incident_types.id
GROUP BY user_id, client_id, log_date, incident_type_id, public.incident_types.category;

COMMENT ON MATERIALIZED VIEW public.daily_totals IS 'Materialized view voor snelle dagelijkse statistieken.';

-- ----------------------------------------------------------------------------
-- View: monthly_summary
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.monthly_summary;
CREATE VIEW public.monthly_summary AS
SELECT 
  date_trunc('month', log_date) as month,
  user_id,
  incident_type_id,
  incident_types.category,
  COUNT(DISTINCT client_id) as unique_clients,
  SUM(count) as total_incidents
FROM public.incident_logs
JOIN public.incident_types ON public.incident_logs.incident_type_id = public.incident_types.id
GROUP BY date_trunc('month', log_date), user_id, incident_type_id, public.incident_types.category;

COMMENT ON VIEW public.monthly_summary IS 'View voor maandelijkse samenvatting en rapportages.';

-- ----------------------------------------------------------------------------
-- Functie voor het verversen van de materialized view
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.refresh_daily_totals() CASCADE;
CREATE OR REPLACE FUNCTION public.refresh_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.daily_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.refresh_daily_totals() IS 'Functie om de daily_totals materialized view automatisch te verversen.';

-- ----------------------------------------------------------------------------
-- Trigger om materialized view te verversen na wijzigingen
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS refresh_daily_totals_trigger ON public.incident_logs;
CREATE TRIGGER refresh_daily_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.incident_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_daily_totals();

-- ============================================================================
-- Fase 3: Row Level Security (RLS) Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies: clients
-- ----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.clients;
CREATE POLICY "Allow authenticated read access" ON public.clients
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin insert access" ON public.clients;
CREATE POLICY "Allow admin insert access" ON public.clients
  FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow admin update access" ON public.clients;
CREATE POLICY "Allow admin update access" ON public.clients
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow admin delete access" ON public.clients;
CREATE POLICY "Allow admin delete access" ON public.clients
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ----------------------------------------------------------------------------
-- RLS Policies: incident_types
-- ----------------------------------------------------------------------------
ALTER TABLE public.incident_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access on active types" ON public.incident_types;
CREATE POLICY "Allow authenticated read access on active types" ON public.incident_types
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin insert access" ON public.incident_types;
CREATE POLICY "Allow admin insert access" ON public.incident_types
  FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow admin update access" ON public.incident_types;
CREATE POLICY "Allow admin update access" ON public.incident_types
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow admin delete access" ON public.incident_types;
CREATE POLICY "Allow admin delete access" ON public.incident_types
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ----------------------------------------------------------------------------
-- RLS Policies: profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
CREATE POLICY "Allow individual read access" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admin read access" ON public.profiles;
CREATE POLICY "Allow admin read access" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
CREATE POLICY "Allow individual update access" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- RLS Policies: incident_logs
-- ----------------------------------------------------------------------------
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow individual insert access" ON public.incident_logs;
CREATE POLICY "Allow individual insert access" ON public.incident_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.incident_logs;
CREATE POLICY "Allow authenticated read access" ON public.incident_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin update access" ON public.incident_logs;
CREATE POLICY "Allow admin update access" ON public.incident_logs
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

DROP POLICY IF EXISTS "Allow admin delete access" ON public.incident_logs;
CREATE POLICY "Allow admin delete access" ON public.incident_logs
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ============================================================================
-- Fase 4: Toegangsrechten
-- ============================================================================
GRANT SELECT ON public.daily_totals TO authenticated;
GRANT SELECT ON public.monthly_summary TO authenticated;

-- ============================================================================
-- Fase 5: Voorbeelddata en initialisatie
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Incident types categoriseren
-- ----------------------------------------------------------------------------
UPDATE public.incident_types SET category = 'fysiek', severity_level = 3 
WHERE name IN ('Bonken', 'Slaan of stompen', 'Schoppen', 'Gooien', 'Grijpen', 'Spugen', 'Krabben', 'Fixatie', 'Fixatie na waarschuwing')
AND category IS NULL;

UPDATE public.incident_types SET category = 'verbaal', severity_level = 2 
WHERE name IN ('Dreigen', 'Schelden')
AND category IS NULL;

-- ----------------------------------------------------------------------------
-- Ververs materialized view
-- ----------------------------------------------------------------------------
REFRESH MATERIALIZED VIEW public.daily_totals;

-- ============================================================================
-- EINDE SCRIPT
-- ============================================================================ 