-- ============================================================================
-- Update Views en Triggers Script
-- Dit script kan veilig worden uitgevoerd om de views, functies en triggers
-- opnieuw aan te maken zonder de bestaande tabellen aan te passen
-- ============================================================================

-- 1. Maandelijkse samenvatting view bijwerken
DROP VIEW IF EXISTS monthly_summary;
CREATE VIEW monthly_summary AS
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

-- 2. Daily totals materialized view bijwerken
DROP MATERIALIZED VIEW IF EXISTS daily_totals;
CREATE MATERIALIZED VIEW daily_totals AS
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

-- 3. Verwijder en hermaak de functie voor het verversen van de materialized view
DROP FUNCTION IF EXISTS refresh_daily_totals() CASCADE;
CREATE OR REPLACE FUNCTION refresh_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verwijder en hermaak de trigger
DROP TRIGGER IF EXISTS refresh_daily_totals_trigger ON public.incident_logs;
CREATE TRIGGER refresh_daily_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.incident_logs
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_daily_totals();

-- 5. Verleen rechten voor de nieuwe objecten aan de gebruikers
GRANT SELECT ON daily_totals TO authenticated;
GRANT SELECT ON monthly_summary TO authenticated;

-- 6. Ververs de materialized view onmiddellijk
REFRESH MATERIALIZED VIEW daily_totals; 