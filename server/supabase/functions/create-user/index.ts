// Supabase Edge Function voor het aanmaken van gebruikers
// Deze functie gebruikt de service role key en wordt aangeroepen vanuit de client

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface voor request body
interface CreateUserRequest {
  email: string
  password: string
  role: 'medewerker' | 'super_admin'
}

// Interface voor response data
interface CreateUserResponse {
  success: boolean
  userId?: string
  message?: string
}

serve(async (req) => {
  // CORS headers voor lokale ontwikkeling (moet worden aangepast in productie)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }

  // OPTIONS request afhandelen (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // Alleen POST requests toestaan
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Body parsen
    const { email, password, role } = await req.json() as CreateUserRequest

    // Validatie
    if (!email) throw new Error('Email is verplicht')
    if (!password) throw new Error('Wachtwoord is verplicht')
    if (!role) throw new Error('Rol is verplicht')

    // Supabase client met service role key (heeft admin rechten)
    const supabaseAdmin = createClient(
      // Supabase URL van environment variable
      Deno.env.get('SUPABASE_URL') ?? '',
      // Service role key van environment variable (NIET de anon/public key)
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Maak gebruiker aan met admin rechten
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Email meteen bevestigen
      user_metadata: {
        role
      }
    })

    if (createError) throw createError

    if (!user.user) {
      throw new Error('Gebruiker kon niet worden aangemaakt')
    }

    // Update de rol in de profiles tabel
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', user.user.id)

    if (updateError) throw updateError

    // Succesvolle response
    const response: CreateUserResponse = {
      success: true,
      userId: user.user.id
    }

    return new Response(JSON.stringify(response), {
      headers,
      status: 200,
    })
  } catch (error) {
    // Error response
    const response: CreateUserResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout'
    }

    return new Response(JSON.stringify(response), {
      headers,
      status: 400,
    })
  }
}) 