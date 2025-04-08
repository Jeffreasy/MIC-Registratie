-- Script om eerst alle policies te verwijderen

-- Optie 1: Verwijder ALLE policies op de clients tabel (meest robuust)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Starting removal of policies on public.clients...';
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'clients' -- Wees specifiek met schema
    LOOP
        RAISE NOTICE 'Attempting to drop policy: %', policy_record.policyname;
        -- %I zorgt voor correcte quoting indien nodig
        EXECUTE FORMAT('DROP POLICY IF EXISTS %I ON public.clients', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on public.clients (if it existed).', policy_record.policyname;
    END LOOP;
    RAISE NOTICE 'Finished removal of policies on public.clients.';
END $$;

-- Optie 2: Verwijder specifiek de problematische policy (als Optie 1 faalt of je alleen deze wilt)
-- Zorg ervoor dat Optie 1 hierboven is uitgecommentarieerd of verwijderd als je deze gebruikt.
-- BEGIN
--     RAISE NOTICE 'Attempting to drop specific policy "Allow admin insert access on table clients"';
--     -- Gebruik dubbele aanhalingstekens omdat de naam spaties bevat
--     DROP POLICY IF EXISTS "Allow admin insert access on table clients" ON public.clients;
--     RAISE NOTICE 'Specific policy drop command executed.';
-- END;


-- Doe hetzelfde voor de profiles tabel indien nodig
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Starting removal of policies on public.profiles...';
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles' -- Wees specifiek met schema
    LOOP
        RAISE NOTICE 'Attempting to drop policy: %', policy_record.policyname;
        EXECUTE FORMAT('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on public.profiles (if it existed).', policy_record.policyname;
    END LOOP;
    RAISE NOTICE 'Finished removal of policies on public.profiles.';
END $$;

-- Optioneel: Controleer of RLS nog aan staat (dit verwijdert geen policies)
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('clients', 'profiles');

-- Optioneel: Schakel RLS uit als laatste redmiddel (dit verwijdert geen policies)
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- RAISE NOTICE 'Row Level Security explicitly disabled for clients and profiles (policies still exist but are inactive).';