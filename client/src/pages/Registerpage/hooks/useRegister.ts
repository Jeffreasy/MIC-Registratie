import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';

const useRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

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

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    message,
    isAuthenticated,
    isLoading,
    handleRegister
  };
};

export default useRegister; 