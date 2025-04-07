import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Optioneel: Voeg een state toe voor wachtwoord bevestigen
  // const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Haal de isAuthenticated status op uit de store
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Als gebruiker al ingelogd is, navigeer naar home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Optioneel: Check of wachtwoorden overeenkomen
    // if (password !== confirmPassword) {
    //   setError('Wachtwoorden komen niet overeen.');
    //   setLoading(false);
    //   return;
    // }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        // Optioneel: Voeg hier extra data toe die je wilt opslaan in auth.users.raw_user_meta_data
        // Dit wordt gebruikt door de handle_new_user trigger om de 'profiles' tabel te vullen.
        // options: {
        //   data: {
        //     full_name: 'Voornaam Achternaam', // Haal dit idealiter uit een extra formulierveld
        //   }
        // }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check of registratie succesvol was maar email verificatie vereist is
      if (data.user && data.user.identities?.length === 0) {
        // Dit gebeurt als "Confirm email" AAN staat in Supabase Auth settings
        // en de gebruiker nog niet bestaat.
         setMessage('Registratie succesvol! Check je e-mail om je account te bevestigen.');
      } else if (data.session) {
         // Gebruiker is direct ingelogd (gebeurt als "Confirm email" UIT staat)
         // Navigatie gebeurt automatisch via onAuthStateChange listener.
         setMessage('Registratie succesvol! Je wordt ingelogd...');
      } else {
         // Andere gevallen, bv. gebruiker bestond al maar was niet bevestigd?
         setMessage('Registratie voltooid. Check je e-mail of probeer in te loggen.');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Er is een fout opgetreden bij het registreren.');
    } finally {
      setLoading(false);
    }
  };

  // Toon laadindicator tijdens initiële sessie check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center py-8 px-4">
          <div className="animate-pulse">Authenticatie controleren...</div>
        </div>
      </div>
    );
  }

  // Render niets als al ingelogd (redirect gebeurt in useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-0 py-6 sm:py-0">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center pb-3 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl">Registreer</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Maak een nieuw account aan met je e-mailadres en wachtwoord
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jouw@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-9 sm:h-10 px-3 sm:px-4 text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Wachtwoord</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-9 sm:h-10 px-3 sm:px-4 text-sm"
              />
            </div>
            {/* Optioneel: Voeg hier input voor wachtwoord bevestigen toe */}
            {error && (
              <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {message && (
              <p className="text-xs sm:text-sm text-green-500 dark:text-green-400">{message}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
            <Button className="w-full h-9 sm:h-10 text-sm" type="submit" disabled={loading}>
              {loading ? 'Bezig met registreren...' : 'Registreer'}
            </Button>
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
              Al een account?{' '}
              <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Login hier
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage; 