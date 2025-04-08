# Database Documentatie

## Database Types

### Tables

#### Clients
```typescript
{
  Row: {
    id: string
    full_name: string
    is_active: boolean
    created_at: string
  }
  Insert: {
    id?: string
    full_name: string
    is_active?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    full_name?: string
    is_active?: boolean
    created_at?: string
  }
}
```

#### Incident Logs
```typescript
{
  Row: {
    id: string
    user_id: string
    client_id: string
    incident_type_id: string
    description: string
    severity: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    client_id: string
    incident_type_id: string
    description: string
    severity: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    client_id?: string
    incident_type_id?: string
    description?: string
    severity?: number
    created_at?: string
    updated_at?: string
  }
}
```

#### Incident Types
```typescript
{
  Row: {
    id: string
    name: string
    category: string
    description: string | null
    created_at: string
  }
  Insert: {
    id?: string
    name: string
    category: string
    description?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    name?: string
    category?: string
    description?: string | null
    created_at?: string
  }
}
```

### Views

#### Daily Totals
```typescript
{
  Row: {
    user_id: string
    client_id: string
    log_date: string
    incident_type_id: number
    category: string | null
    total_count: number
  }
}
```

#### Monthly Summary
```typescript
{
  Row: {
    month: string
    user_id: string
    incident_type_id: number
    category: string | null
    unique_clients: number
    total_incidents: number
  }
}
```

## Database Structuur

### Materialized Views
```sql
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
```

### Database Triggers
```sql
CREATE OR REPLACE FUNCTION refresh_daily_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row Level Security Policies

#### Clients Table
```sql
CREATE POLICY "Allow authenticated read access" 
  ON public.clients FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin insert access" 
  ON public.clients FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('beheerder', 'super_admin'));
```

#### Profiles Table
```sql
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');
```

## Database Migraties

### Profiles Table Setup
```sql
-- Enum type voor gebruikersrollen
CREATE TYPE public.user_role AS ENUM ('medewerker', 'super_admin');

-- Profiles tabel structuur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'medewerker'::public.user_role,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT
);

-- Gecombineerde view voor gebruikersgegevens
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.updated_at AS profile_updated_at,
  u.email,                           
  u.created_at AS user_created_at,   
  u.confirmed_at,
  u.last_sign_in_at
FROM 
  public.profiles p
JOIN 
  auth.users u ON p.id = u.id;
```

### Database Optimizations
```sql
-- Indexes voor betere performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Automatische timestamp updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- NOT NULL constraints
ALTER TABLE public.profiles 
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;
```

### Migratie Volgorde
1. `remove_policies.sql`: Verwijder bestaande policies
2. `alter_role_only.sql`: Wijzig role kolom naar ENUM type
3. `other_optimizations.sql`: Voeg optimalisaties toe 