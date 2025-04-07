import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Combineer username met @sheerenloo.nl domein
    const email = username.includes('@') ? username : `${username}@sheerenloo.nl`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Er is een fout opgetreden bij het inloggen.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-slate-900">
        <div className="absolute top-4 right-4">
          {/* Theme Toggle in top-right corner */}
        </div>
        <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8">
          <div className="animate-pulse flex justify-center">
            <div className="h-12 w-48 bg-blue-100 dark:bg-blue-900 rounded mb-4"></div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 mx-auto bg-blue-100 dark:bg-blue-900 rounded"></div>
            <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
            <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
            <div className="h-12 bg-blue-100 dark:bg-blue-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-0">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        {/* Theme Toggle in top-right corner */}
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-10 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">Sheerenloo</h1>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Inloggen</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Toegang tot uw MIC-registratie omgeving
            </p>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-10 py-4 sm:py-6">
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
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
                    autoComplete="username"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground text-xs sm:text-sm">@sheerenloo.nl</span>
                  </div>
                </div>
              </div>
              
              {/* Wachtwoord veld */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password" className="block text-sm font-medium">
                    Wachtwoord
                  </Label>
                  <Link to="/forgot-password" className="text-xs sm:text-sm font-medium text-primary hover:text-primary/90">
                    Wachtwoord vergeten?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-input rounded-md shadow-sm placeholder-muted-foreground 
                  focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                  autoComplete="current-password"
                />
              </div>
              
              {/* Error melding */}
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-xs sm:text-sm">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Login knop */}
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
                      <span className="text-sm">Bezig met inloggen...</span>
                    </>
                  ) : 'Inloggen'}
                </Button>
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

export default LoginPage; 