import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Omgevingsvariabelen importeren
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validatie controleren
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL en/of Anonymous Key niet geconfigureerd. Controleer je .env bestand.')
}

// Supabase client aanmaken met de omgevingsvariabelen
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Instellingen voor authenticatie (indien nodig)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Globale instellingen (indien nodig)
    headers: {
      'x-application-name': 'mic-registratie',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'x-application-name, authorization, x-client-info, apikey, content-type'
    }
  },
  realtime: {
    // Realtime instellingen (indien nodig)
    params: {
      eventsPerSecond: 10
    }
  }
})

// Stille verbindingscontrole zonder console logs
void (async () => {
  try {
    await supabase.from('profiles').select('count', { count: 'exact', head: true })
  } catch (error) {
    // Fout alleen in development mode loggen
    if (import.meta.env.DEV) {
      console.error('Supabase verbindingsfout:', error)
    }
  }
})()

// Exporteer een functie om de huidige auth user op te halen
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    // Alleen in development mode loggen
    if (import.meta.env.DEV) {
      console.error('Fout bij ophalen gebruiker:', error)
    }
    return null
  }
}

// Helper functie om naar een specifieke tabel te luisteren voor veranderingen
export const subscribeToTable = (
  tableName: 'incident_logs' | 'clients' | 'incident_types',
  callback: (payload: RealtimePostgresChangesPayload<Record<string, any>>) => void
) => {
  return supabase
    .channel(`table-changes:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => callback(payload)
    )
    .subscribe()
}

// Voor debugging
if (import.meta.env.DEV) {
  // @ts-ignore - Voeg supabase toe aan window in development
  window.supabase = supabase
} 