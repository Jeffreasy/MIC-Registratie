import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Gebruik env variabelen voor de Supabase URL en anonieme sleutel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Controleer of de API sleutels aanwezig zijn
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL en/of Anonieme Sleutel ontbreken. Controleer je .env.local bestand.')
}

// Creëer de Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    // Configureer realtime voor incident_logs tabel
    // Hiermee kunnen we live updates ontvangen wanneer incident logs worden toegevoegd
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper functie om naar een specifieke tabel te luisteren voor veranderingen
export const subscribeToTable = (
  tableName: 'incident_logs' | 'clients' | 'incident_types',
  callback: (payload: any) => void
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