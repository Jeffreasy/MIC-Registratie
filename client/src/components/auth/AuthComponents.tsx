import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  AUTH_HEADER_CLASSES,
  AUTH_TITLE_CLASSES,
  AUTH_SUBTITLE_CLASSES,
  AUTH_DESCRIPTION_CLASSES,
  AUTH_FOOTER_CLASSES,
  AUTH_FOOTER_TEXT_CLASSES,
  AUTH_BUTTON_CLASSES,
  AUTH_BUTTON_ICON_CLASSES,
  AUTH_ERROR_CLASSES,
  AUTH_SUCCESS_CLASSES
} from '@/lib/auth-styles';

/**
 * Gestandaardiseerde button component voor authenticatie formulieren
 */
interface AuthButtonProps {
  loading: boolean;
  loadingText: string;
  children: React.ReactNode;
  [x: string]: any; // Overige props
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  loading, 
  loadingText,
  children,
  className = "",
  ...props 
}) => (
  <Button
    className={`${AUTH_BUTTON_CLASSES} ${className}`}
    disabled={loading}
    {...props}
  >
    {loading ? (
      <>
        <svg className={AUTH_BUTTON_ICON_CLASSES} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm">{loadingText}</span>
      </>
    ) : children}
  </Button>
);

/**
 * Gestandaardiseerde header component voor authenticatie kaarten
 */
interface AuthCardHeaderProps {
  title: string;
  subtitle: string;
  description?: string;
  logo?: string;
}

export const AuthCardHeader: React.FC<AuthCardHeaderProps> = ({ 
  title, 
  subtitle, 
  description,
  logo
}) => (
  <div className={AUTH_HEADER_CLASSES}>
    {logo ? (
      <div className="flex justify-center mb-4">
        <img src={logo} alt={title} className="h-12 w-auto" />
      </div>
    ) : (
      <h1 className={AUTH_TITLE_CLASSES}>{title}</h1>
    )}
    <h2 className={AUTH_SUBTITLE_CLASSES}>{subtitle}</h2>
    {description && (
      <p className={AUTH_DESCRIPTION_CLASSES}>{description}</p>
    )}
  </div>
);

/**
 * Gestandaardiseerde footer component voor authenticatie kaarten
 */
export const AuthCardFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={AUTH_FOOTER_CLASSES}>
    <p className={AUTH_FOOTER_TEXT_CLASSES}>
      © {new Date().getFullYear()} Sheerenloo - MIC Registratie | Privacy & Security
    </p>
    {children}
  </div>
);

/**
 * Gestandaardiseerde error message component
 */
export const AuthErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className={AUTH_ERROR_CLASSES}>
      <p>{message}</p>
    </div>
  );
};

/**
 * Gestandaardiseerde success message component
 */
export const AuthSuccessMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className={AUTH_SUCCESS_CLASSES}>
      <p>{message}</p>
    </div>
  );
}; 