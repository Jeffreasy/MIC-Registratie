-- Stored procedures voor StatisticsTab in de admin interface

-- Functie om totalen per categorie op te halen
CREATE OR REPLACE FUNCTION get_category_totals(start_date DATE, end_date DATE)
RETURNS TABLE (
  category TEXT,
  total_count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    category,
    SUM(total_count) AS total_count
  FROM 
    daily_totals
  WHERE 
    log_date >= start_date AND log_date <= end_date
  GROUP BY 
    category
  ORDER BY 
    total_count DESC;
$$;

-- Functie om totaal aantal incidenten op te halen
CREATE OR REPLACE FUNCTION get_total_incidents(start_date DATE, end_date DATE)
RETURNS TABLE (
  count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    SUM(total_count) AS count
  FROM 
    daily_totals
  WHERE 
    log_date >= start_date AND log_date <= end_date;
$$;

-- Functie om aantal unieke cliënten op te halen
CREATE OR REPLACE FUNCTION get_unique_clients(start_date DATE, end_date DATE)
RETURNS TABLE (
  count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    COUNT(DISTINCT client_id) AS count
  FROM 
    daily_totals
  WHERE 
    log_date >= start_date AND log_date <= end_date;
$$;

-- Functie om aantal unieke incident types op te halen
CREATE OR REPLACE FUNCTION get_unique_incident_types(start_date DATE, end_date DATE)
RETURNS TABLE (
  count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    COUNT(DISTINCT incident_type_id) AS count
  FROM 
    daily_totals
  WHERE 
    log_date >= start_date AND log_date <= end_date;
$$; 