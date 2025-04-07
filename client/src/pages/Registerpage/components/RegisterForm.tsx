import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AuthCard, 
  AuthButton, 
  AuthErrorMessage,
  AuthSuccessMessage
} from '@/components/auth';
import { AUTH_INPUT_WRAPPER_CLASSES, AUTH_INPUT_CLASSES, AUTH_LINK_CLASSES } from '@/lib/auth-styles';

interface RegisterFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  message: string | null;
  handleRegister: (event: React.FormEvent<HTMLFormElement>) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  message,
  handleRegister
}) => {
  return (
    <AuthCard
      title="Sheerenloo"
      subtitle="Registreer"
      description="Maak een nieuw account aan met je e-mailadres en wachtwoord"
      onSubmit={handleRegister}
      footerContent={
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-2">
          Al een account?{' '}
          <Link to="/login" className={AUTH_LINK_CLASSES}>
            Login hier
          </Link>
        </p>
      }
    >
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
        <Label htmlFor="email" className="text-sm">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="jouw@email.com" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={AUTH_INPUT_CLASSES}
        />
      </div>
      
      <div className={AUTH_INPUT_WRAPPER_CLASSES}>
        <Label htmlFor="password" className="text-sm">Wachtwoord</Label>
        <Input 
          id="password" 
          type="password" 
          placeholder="••••••••" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className={AUTH_INPUT_CLASSES}
        />
      </div>
      
      <AuthErrorMessage message={error} />
      <AuthSuccessMessage message={message} />
      
      <div>
        <AuthButton 
          type="submit" 
          loading={loading} 
          loadingText="Bezig met registreren..."
        >
          Registreer
        </AuthButton>
      </div>
    </AuthCard>
  );
};

export default RegisterForm; 