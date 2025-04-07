export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
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
      incident_logs: {
        Row: {
          id: number
          created_at: string
          user_id: string
          client_id: string
          incident_type_id: number
          log_date: string
          count: number
          notes: string | null
          location: string | null
          severity: number | null
          time_of_day: string | null
          triggered_by: string | null
          intervention_successful: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          client_id: string
          incident_type_id: number
          log_date?: string
          count: number
          notes?: string | null
          location?: string | null
          severity?: number | null
          time_of_day?: string | null
          triggered_by?: string | null
          intervention_successful?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          client_id?: string
          incident_type_id?: number
          log_date?: string
          count?: number
          notes?: string | null
          location?: string | null
          severity?: number | null
          time_of_day?: string | null
          triggered_by?: string | null
          intervention_successful?: boolean
        }
      }
      incident_types: {
        Row: {
          id: number
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          category: 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null
          severity_level: number | null
          requires_notification: boolean
          color_code: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          category?: 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null
          severity_level?: number | null
          requires_notification?: boolean
          color_code?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          category?: 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null
          severity_level?: number | null
          requires_notification?: boolean
          color_code?: string | null
        }
      }
    }
    Views: {
      daily_totals: {
        Row: {
          user_id: string
          client_id: string
          log_date: string
          incident_type_id: number
          category: string | null
          total_count: number
        }
      }
      monthly_summary: {
        Row: {
          month: string
          user_id: string
          incident_type_id: number
          category: string | null
          unique_clients: number
          total_incidents: number
        }
      }
    }
    Functions: {
      refresh_daily_totals: {
        Args: Record<string, never>
        Returns: null
      }
    }
  }
} 