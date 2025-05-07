import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AuthCard, 
  AuthButton, 
  AuthErrorMessage 
} from '@/components/auth';
import { AUTH_INPUT_WRAPPER_CLASSES, AUTH_INPUT_CLASSES, AUTH_LINK_CLASSES } from '@/lib/auth-styles';
import logo from '@/assets/sqcqweq_ncn3om.webp';

interface LoginFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  handleLogin: (event: React.FormEvent<HTMLFormElement>) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  loading,
  error,
  handleLogin
}) => {
  return (
    <AuthCard
      title="Sheerenloo"
      subtitle="Inloggen"
      description="Toegang tot uw MIC-registratie omgeving"
      logo={logo}
      onSubmit={handleLogin}
    >
      {/* Gebruikersnaam veld */}
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
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
            className={AUTH_INPUT_CLASSES}
            autoComplete="username"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-muted-foreground text-xs sm:text-sm">@sheerenloo.nl</span>
          </div>
        </div>
      </div>
      
      {/* Wachtwoord veld */}
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="password" className="block text-sm font-medium">
            Wachtwoord
          </Label>
          <Link to="/forgot-password" className={`text-xs sm:text-sm ${AUTH_LINK_CLASSES}`}>
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
          className={AUTH_INPUT_CLASSES}
          autoComplete="current-password"
        />
      </div>
      
      {/* Error melding */}
      <AuthErrorMessage message={error} />
      
      {/* Login knop */}
      <div>
        <AuthButton 
          type="submit" 
          loading={loading} 
          loadingText="Bezig met inloggen..."
        >
          Inloggen
        </AuthButton>
      </div>
    </AuthCard>
  );
};

export default LoginForm; 