import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AuthCard, 
  AuthButton, 
  AuthErrorMessage,
  AuthSuccessMessage
} from '@/components/auth';
import { AUTH_INPUT_WRAPPER_CLASSES, AUTH_INPUT_CLASSES, AUTH_LINK_CLASSES } from '@/lib/auth-styles';

interface ResetPasswordFormProps {
  username: string;
  setUsername: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  message: string | null;
  error: string | null;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
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
}) => {
  return (
    <AuthCard
      title="Sheerenloo"
      subtitle="Wachtwoord resetten"
      description="Vul uw gebruikersnaam in en kies een nieuw wachtwoord"
      onSubmit={handleSubmit}
      footerContent={
        <div className="text-center mt-2 sm:mt-4">
          <Link to="/login" className={`text-xs sm:text-sm ${AUTH_LINK_CLASSES}`}>
            Terug naar inloggen
          </Link>
        </div>
      }
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
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-muted-foreground text-xs sm:text-sm">@sheerenloo.nl</span>
          </div>
        </div>
      </div>
      
      {/* Nieuw wachtwoord veld */}
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
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
          className={AUTH_INPUT_CLASSES}
          autoComplete="new-password"
        />
      </div>
      
      {/* Bevestig wachtwoord veld */}
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
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
          className={AUTH_INPUT_CLASSES}
          autoComplete="new-password"
        />
      </div>
      
      {/* Error en success messages */}
      <AuthErrorMessage message={error} />
      <AuthSuccessMessage message={message} />
      
      {/* Submit knop */}
      <div>
        <AuthButton 
          type="submit" 
          loading={loading} 
          loadingText="Bezig met resetten..."
        >
          Wachtwoord resetten
        </AuthButton>
      </div>
    </AuthCard>
  );
};

export default ResetPasswordForm; 