import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Save, KeyRound } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';

interface AccountSettingsCardProps {
  user: User | null;
  userProfile: UserProfile | null;
  onUpdateProfile: (fullName: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
  successMessage: string | null;
}

const AccountSettingsCard: React.FC<AccountSettingsCardProps> = ({
  user,
  userProfile,
  onUpdateProfile,
  onResetPassword,
  isUpdating,
  error,
  successMessage
}) => {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(fullName);
  };

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      await onResetPassword();
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accountinstellingen</CardTitle>
        <CardDescription>Beheer je accountgegevens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Volledige naam</Label>
            <Input
              id="full-name"
              name="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jouw volledige naam"
              disabled={isUpdating}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isUpdating || !user}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met opslaan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Profiel bijwerken
              </>
            )}
          </Button>
        </form>

        <div className="border-t pt-4 space-y-2">
          <Label>Wachtwoord wijzigen</Label>
          <p className="text-sm text-muted-foreground">
            We sturen een wachtwoord reset link naar je e-mailadres: {user?.email}
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handlePasswordReset}
            disabled={isResettingPassword || !user}
          >
            {isResettingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met verzenden...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Wachtwoord reset link versturen
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-sm">
            {successMessage}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Je e-mailadres kan niet worden gewijzigd. Neem contact op met de beheerder als dit nodig is.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AccountSettingsCard; 