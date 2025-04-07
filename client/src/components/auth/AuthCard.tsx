import React from 'react';
import { AUTH_CARD_CLASSES, AUTH_CONTENT_CLASSES, AUTH_FORM_CLASSES } from '@/lib/auth-styles';
import { AuthCardHeader, AuthCardFooter } from './AuthComponents';

interface AuthCardProps {
  title: string;
  subtitle: string;
  description?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Gestandaardiseerde kaart component voor authenticatie formulieren
 * Deze component combineert de header, content en footer in één herbruikbare component
 */
const AuthCard: React.FC<AuthCardProps> = ({
  title,
  subtitle,
  description,
  children,
  footerContent,
  onSubmit
}) => {
  const content = (
    <div className={AUTH_CONTENT_CLASSES}>
      {onSubmit ? (
        <form onSubmit={onSubmit} className={AUTH_FORM_CLASSES}>
          {children}
        </form>
      ) : (
        <div className={AUTH_FORM_CLASSES}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className={AUTH_CARD_CLASSES}>
        <AuthCardHeader 
          title={title} 
          subtitle={subtitle} 
          description={description} 
        />
        
        {content}
        
        <AuthCardFooter>
          {footerContent}
        </AuthCardFooter>
      </div>
    </div>
  );
};

export default AuthCard; 