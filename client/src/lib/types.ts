// Database modellen die overeenkomen met de Supabase tabellen

// User rollen
export type UserRole = 'medewerker' | 'super_admin';

// User Profile model
export interface UserProfile {
  id: string;
  email?: string | null;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
}

// Incident Types met nieuwe velden
export interface IncidentType {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  category: 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null;
  severity_level: number | null;
  requires_notification: boolean;
  color_code: string | null;
}

// Clients
export interface Client {
  id: string; // uuid
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// Incident Logs met nieuwe velden
export interface IncidentLog {
  id: number;
  created_at: string;
  user_id: string;
  client_id: string;
  incident_type_id: number;
  log_date: string;
  count: number;
  notes: string | null;
  location: string | null;
  severity: number | null;
  time_of_day: string | null; // TIME format
  triggered_by: string | null;
  intervention_successful: boolean;
}

// Join met relaties voor weergave
export interface IncidentLogWithRelations {
  id: number;
  created_at: string;
  log_date: string;
  user_id: string;
  count: number;
  notes: string | null;
  location: string | null;
  severity: number | null;
  time_of_day: string | null;
  triggered_by: string | null;
  intervention_successful: boolean;
  client: {
    full_name: string;
  };
  incident_type: {
    name: string;
    category: string | null;
    severity_level: number | null;
    color_code: string | null;
    requires_notification: boolean;
  };
  // Afgeleide waarden, niet in database
  client_id?: string;         // Toegevoegd als alias
  incident_type_id?: number;  // Toegevoegd als alias
  combinedLogIds?: number[];  // Voor gegroepeerde logs
}

// Voor de dagelijkse totalen
export interface DailyTotal {
  id: number;
  log_date: string;
  user_id: string;
  total_count: number;
}

// Voor de maandelijkse samenvatting
export interface MonthlySummary {
  id: number;
  month: string;
  user_id: string;
  total_count: number;
}

// Voor statistiek componenten
export interface CategoryTotal {
  category: string | null;
  total_count: number;
}

export interface CountResult {
  count: number;
}

// Type voor gegroepeerde incidents per type
export interface IncidentTypeWithTotals {
  name: string;
  count: number;
  category: string | null;
  severity_level: number | null;
  color_code: string | null;
  logs: IncidentLogWithRelations[];
} 