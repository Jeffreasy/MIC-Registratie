import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPasswordPage: React.FC = () => {
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
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Er is een fout opgetreden bij het resetten van het wachtwoord.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-0">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-10 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">Sheerenloo</h1>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Wachtwoord resetten</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vul uw gebruikersnaam in en kies een nieuw wachtwoord
            </p>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-10 py-4 sm:py-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Gebruikersnaam veld */}
              <div>
                <Label htmlFor="username" className="block text-sm font-medium mb-1">
                  Gebruikersnaam
                </Label>
                <div className="relative mt-1">
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="gebruikersnaam" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-input rounded-md shadow-sm placeholder-muted-foreground 
                    focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground text-xs sm:text-sm">@sheerenloo.nl</span>
                  </div>
                </div>
              </div>
              
              {/* Nieuw wachtwoord veld */}
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  Nieuw wachtwoord
                </Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-input rounded-md shadow-sm placeholder-muted-foreground 
                  focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                  autoComplete="new-password"
                />
              </div>
              
              {/* Bevestig wachtwoord veld */}
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Bevestig wachtwoord
                </Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-input rounded-md shadow-sm placeholder-muted-foreground 
                  focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                  autoComplete="new-password"
                />
              </div>
              
              {/* Error melding */}
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-xs sm:text-sm">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Success message */}
              {message && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-xs sm:text-sm">
                  <p>{message}</p>
                </div>
              )}
              
              {/* Submit knop */}
              <div>
                <Button 
                  className="w-full flex justify-center py-2 sm:py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium 
                  text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Bezig met resetten...</span>
                    </>
                  ) : 'Wachtwoord resetten'}
                </Button>
              </div>

              <div className="text-center mt-2 sm:mt-4">
                <Link to="/login" className="text-xs sm:text-sm font-medium text-primary hover:text-primary/90">
                  Terug naar inloggen
                </Link>
              </div>
            </form>
          </div>
          
          {/* Footer */}
          <div className="px-6 sm:px-10 py-3 sm:py-4 bg-muted/30 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Sheerenloo - MIC Registratie | Privacy & Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 