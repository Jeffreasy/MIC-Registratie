// Supabase Edge Function voor wachtwoord reset
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Interface voor request body
interface PasswordResetRequest {
  email: string;
  newPassword: string;
}

// Interface voor response data
interface PasswordResetResponse {
  success: boolean;
  message?: string;
}

serve(async (req) => {
  // CORS headers voor lokale ontwikkeling (moet worden aangepast in productie)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS request afhandelen (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers, status: 200 });
  }

  try {
    // Alleen POST requests toestaan
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Body parsen
    const { email, newPassword } = await req.json() as PasswordResetRequest;

    // Validatie
    if (!email) throw new Error('Email is verplicht');
    if (!newPassword) throw new Error('Nieuw wachtwoord is verplicht');

    // Supabase client met service role key (heeft admin rechten)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Zoek de gebruiker op basis van email
    const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email
      }
    });

    if (searchError) throw searchError;
    if (!users || users.length === 0) {
      throw new Error('Gebruiker niet gevonden');
    }

    const user = users[0];

    // Update het wachtwoord
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Succesvolle response
    const response: PasswordResetResponse = {
      success: true,
      message: 'Wachtwoord succesvol gereset'
    };

    return new Response(JSON.stringify(response), {
      headers,
      status: 200,
    });
  } catch (error) {
    // Error response
    const response: PasswordResetResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout'
    };

    return new Response(JSON.stringify(response), {
      headers,
      status: 400,
    });
  }
});