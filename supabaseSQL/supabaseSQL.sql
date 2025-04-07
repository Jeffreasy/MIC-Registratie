-- ============================================================================
-- Fase 1: Database Schema Definitie
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabel: clients
-- ----------------------------------------------------------------------------
CREATE TABLE public.clients (
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
-- Tabel: incident_types
-- ----------------------------------------------------------------------------
CREATE TABLE public.incident_types (
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

-- ----------------------------------------------------------------------------
-- Tabel: profiles
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Tabel: incident_logs
-- ----------------------------------------------------------------------------
CREATE TABLE public.incident_logs (
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

-- ----------------------------------------------------------------------------
-- Indexen (voor performance)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_incident_logs_client_date ON public.incident_logs (client_id, log_date);
CREATE INDEX idx_incident_logs_user_id ON public.incident_logs (user_id);
CREATE INDEX idx_incident_logs_type_id ON public.incident_logs (incident_type_id);

CREATE INDEX IF NOT EXISTS idx_incident_logs_user_date 
ON public.incident_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS idx_incident_logs_client
ON public.incident_logs(client_id);

CREATE INDEX IF NOT EXISTS idx_incident_logs_type
ON public.incident_logs(incident_type_id);

-- ============================================================================
-- Fase 1: Row Level Security (RLS) Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies: clients
-- ----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin insert access" ON public.clients
  FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow admin update access" ON public.clients
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow admin delete access" ON public.clients
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ----------------------------------------------------------------------------
-- RLS Policies: incident_types
-- ----------------------------------------------------------------------------
ALTER TABLE public.incident_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access on active types" ON public.incident_types
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Allow admin insert access" ON public.incident_types
  FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow admin update access" ON public.incident_types
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow admin delete access" ON public.incident_types
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ----------------------------------------------------------------------------
-- RLS Policies: profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow admin read access" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow individual update access" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- RLS Policies: incident_logs
-- ----------------------------------------------------------------------------
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual insert access" ON public.incident_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated read access" ON public.incident_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin update access" ON public.incident_logs
  FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

CREATE POLICY "Allow admin delete access" ON public.incident_logs
  FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beheerder');

-- ============================================================================
-- Einde SQL Script
-- ============================================================================

-- 2. Context toevoegen aan incident_logs voor betere rapportage
ALTER TABLE public.incident_logs 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS severity INTEGER CHECK (severity BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS time_of_day TIME,
ADD COLUMN IF NOT EXISTS triggered_by TEXT,
ADD COLUMN IF NOT EXISTS intervention_successful BOOLEAN DEFAULT true;

-- 3. Categorisering van incident types
UPDATE public.incident_types SET category = 'fysiek', severity_level = 3 WHERE name IN ('Bonken', 'Slaan of stompen', 'Schoppen', 'Gooien', 'Grijpen', 'Spugen', 'Krabben', 'Fixatie', 'Fixatie na waarschuwing');
UPDATE public.incident_types SET category = 'verbaal', severity_level = 2 WHERE name IN ('Dreigen', 'Schelden');

-- 4. Materialized view voor dashboards en rapportages
CREATE OR REPLACE MATERIALIZED VIEW daily_totals AS
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

-- 5. Functie voor het periodiek verversen van de materialized view
CREATE OR REPLACE FUNCTION refresh_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger om materialized view te verversen na wijzigingen
CREATE OR REPLACE TRIGGER refresh_daily_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.incident_logs
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_daily_totals();

-- 7. Maandelijkse samenvatting view voor langetermijn trends
CREATE OR REPLACE VIEW monthly_summary AS
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