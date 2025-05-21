import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const useForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Wachtwoord validatie
    if (newPassword !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens lang zijn.');
      setLoading(false);
      return;
    }

    // Combineer username met @sheerenloo.nl domein als er geen @ in zit
    const email = username.includes('@') ? username : `${username}@sheerenloo.nl`;

    try {
      // Directe wachtwoordreset via de Edge Function
      const { data, error: resetError } = await supabase.functions.invoke('quick-worker', {
        body: { email, newPassword }
      });

      if (resetError) throw resetError;
      if (!data.success) throw new Error(data.message || 'Wachtwoord reset mislukt');

      setMessage('Wachtwoord is succesvol gereset. U wordt doorgestuurd naar de inlogpagina...');
      
      // Na 3 seconden doorsturen naar login pagina
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      let errorMessage = 'Er is een fout opgetreden bij het resetten van het wachtwoord.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      // Specifieke error handling voor Supabase FunctionError als die een bekende structuur heeft
      // Voor nu gebruiken we de algemene err.message als die bestaat
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    message,
    error,
    handleSubmit
  };
};

export default useForgotPassword; 