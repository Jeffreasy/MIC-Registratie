-- Script om alleen het type van de role kolom te wijzigen

-- Zorg ervoor dat het juiste schema wordt gebruikt
SET search_path TO public;

-- 1. Maak het ENUM type aan als het nog niet bestaat
DO $$ 
BEGIN
  RAISE NOTICE 'Controleren of user_role ENUM type bestaat...';
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'ENUM type user_role wordt aangemaakt...';
    CREATE TYPE public.user_role AS ENUM ('medewerker', 'super_admin');
    RAISE NOTICE 'ENUM type user_role is succesvol aangemaakt.';
  ELSE
    RAISE NOTICE 'ENUM type user_role bestaat al, geen actie nodig.';
  END IF;
END $$;

-- 2. Controleer of er al een kolom met het juiste type bestaat
-- (Deze check is nuttig maar niet strikt noodzakelijk voor de conversie zelf)
DO $$
DECLARE
  role_type TEXT;
  enum_oid OID;
BEGIN
  -- Haal het huidige type van de role kolom op
  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod) INTO role_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attname = 'role'
    AND NOT a.attisdropped; -- Zorg dat we geen gedropte kolom selecteren

  -- Haal OID van ons ENUM type op
  SELECT t.oid INTO enum_oid 
  FROM pg_type t 
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE t.typname = 'user_role' AND n.nspname = 'public';

  -- Controleer of het type al correct is
  IF EXISTS (
    SELECT 1 FROM pg_attribute a
    WHERE a.attrelid = 'public.profiles'::regclass
      AND a.attname = 'role'
      AND a.atttypid = enum_oid -- Vergelijk direct met OID van ENUM
      AND NOT a.attisdropped
  ) THEN
    RAISE NOTICE 'Role kolom is al van het type user_role. Geen wijzigingen nodig.';
    -- Je zou hier kunnen stoppen met een RETURN of EXCEPTION als je wilt dat het script niet verder gaat
    -- RETURN; 
  ELSE
    RAISE NOTICE 'Role kolom aanpassen van type % naar ENUM user_role...', COALESCE(role_type, 'onbekend/bestaat niet');
  END IF;
END $$;

-- 3. Tijdelijk een nieuwe kolom aanmaken met het juiste type
DO $$
BEGIN
  RAISE NOTICE 'Aanmaken van tijdelijke kolom role_new met ENUM type...';
END $$;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role_new public.user_role;

DO $$
BEGIN
  RAISE NOTICE 'Tijdelijke kolom role_new is toegevoegd (of bestond al).';
END $$;

-- 4. Update de nieuwe kolom met de waarde uit de oude kolom (alleen als oude kolom nog niet ENUM is)
DO $$
DECLARE
  is_already_enum BOOLEAN := FALSE;
BEGIN
  -- Controleer nogmaals of de originele kolom al ENUM is
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    WHERE a.attrelid = 'public.profiles'::regclass
      AND a.attname = 'role'
      AND t.typname = 'user_role'
      AND NOT a.attisdropped
  ) INTO is_already_enum;

  IF NOT is_already_enum THEN
    RAISE NOTICE 'Data converteren van role (huidig type) naar role_new (ENUM)...';
    -- Gebruik USING clause in ALTER TABLE voor directe conversie (alternatief voor aparte kolom)
    -- Maar de aparte kolom methode is veiliger bij grote tabellen of complexe conversies.
    -- We blijven bij de aparte kolom methode:
    UPDATE public.profiles
    SET role_new = role::public.user_role
    WHERE role_new IS NULL; -- Update alleen waar nodig
    RAISE NOTICE 'Data conversie poging voltooid.';
  ELSE
     RAISE NOTICE 'Originele role kolom was al ENUM, data conversie overgeslagen.';
  END IF;

END $$;


-- 5. Controleer of alle waarden correct zijn overgezet (alleen relevant als conversie is uitgevoerd)
DO $$
DECLARE
  null_count INTEGER;
  is_already_enum BOOLEAN := FALSE;
BEGIN
  -- Check of conversie überhaupt nodig was
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    WHERE a.attrelid = 'public.profiles'::regclass
      AND a.attname = 'role'
      AND t.typname = 'user_role'
      AND NOT a.attisdropped
  ) INTO is_already_enum;

  IF NOT is_already_enum THEN
      -- Controleer of er rijen zijn met een oude waarde die niet geconverteerd kon worden naar de nieuwe kolom
      SELECT COUNT(*) INTO null_count
      FROM public.profiles
      WHERE role IS NOT NULL AND role_new IS NULL; 
      
      IF null_count > 0 THEN
        RAISE WARNING 'LET OP: % rijen hebben geen role_new waarde, maar wel een role waarde!', null_count;
        RAISE WARNING 'Mogelijk zijn er role waarden die niet naar het ENUM type geconverteerd konden worden (bijv. ongeldige tekst).';
        RAISE WARNING 'Controleer of alle waarden in de originele role kolom (indien TEXT) exact overeenkomen met ''medewerker'' of ''super_admin''.';
      ELSE
        RAISE NOTICE 'Alle relevante role waarden lijken succesvol geconverteerd naar role_new.';
      END IF;
  ELSE
      RAISE NOTICE 'Controle voor conversie overgeslagen omdat kolom al ENUM was.';
  END IF;
END $$;

-- 6. Verwijder de oude kolom en hernoem de nieuwe kolom
DO $$
DECLARE
  is_already_enum BOOLEAN := FALSE;
BEGIN
  -- Check of de actie nodig is
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    WHERE a.attrelid = 'public.profiles'::regclass
      AND a.attname = 'role'
      AND t.typname = 'user_role'
      AND NOT a.attisdropped
  ) INTO is_already_enum;

  IF NOT is_already_enum AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role_new') THEN
      RAISE NOTICE 'Oude role kolom vervangen door nieuwe role_new kolom...';

      -- *** CORRECTIE HIER ***
      -- Eerst de oude kolom verwijderen (gebruik IF EXISTS voor veiligheid)
      ALTER TABLE public.profiles
        DROP COLUMN IF EXISTS role;

      -- Dan de nieuwe kolom hernoemen
      ALTER TABLE public.profiles
        RENAME COLUMN role_new TO role;
      -- *** EINDE CORRECTIE ***

      RAISE NOTICE 'Role kolom is succesvol vervangen door de nieuwe kolom met ENUM type.';
  ELSE
      RAISE NOTICE 'Vervangen van kolom overgeslagen (was al ENUM of role_new bestaat niet).';
  END IF;
END $$;

-- 7. Voeg constraints toe aan de (nieuwe) kolom (indien nodig)
DO $$
DECLARE
  col_exists BOOLEAN;
  is_not_null BOOLEAN;
  has_default BOOLEAN;
BEGIN
  -- Controleer of kolom bestaat
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') INTO col_exists;
  
  IF col_exists THEN
      RAISE NOTICE 'Constraints controleren/toevoegen aan role kolom...';

      -- Check NOT NULL
      SELECT (is_nullable = 'NO') INTO is_not_null 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role';
      
      IF NOT is_not_null THEN
          ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
          RAISE NOTICE 'NOT NULL constraint toegevoegd aan role.';
      ELSE
          RAISE NOTICE 'NOT NULL constraint bestond al voor role.';
      END IF;

      -- Check DEFAULT
      SELECT (column_default IS NOT NULL) INTO has_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role';

      IF NOT has_default THEN
          ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'medewerker'::public.user_role;
           RAISE NOTICE 'DEFAULT waarde toegevoegd aan role.';
      ELSE
           RAISE NOTICE 'DEFAULT waarde bestond al voor role.';
      END IF;

      RAISE NOTICE 'Constraints voor role kolom zijn ingesteld/gecontroleerd.';
      RAISE NOTICE 'Voltooiing van role kolom type conversie naar ENUM.';
      RAISE NOTICE 'Ga nu verder met het uitvoeren van het other_optimizations.sql script indien nodig.';
  ELSE
      RAISE NOTICE 'Role kolom niet gevonden, constraints niet toegepast.';
  END IF;
END $$;

-- EINDE VAN HET SCRIPT