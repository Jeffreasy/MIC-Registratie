import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from '@/lib/types';

interface DebugSettingsCardProps {
  role: string | null;
  isUpdating: boolean;
  error: string | null;
  successMessage: string | null;
  onRoleChange: (role: UserRole) => void;
}

const DebugSettingsCard: React.FC<DebugSettingsCardProps> = ({
  role,
  isUpdating,
  error,
  successMessage,
  onRoleChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Instellingen</CardTitle>
        <CardDescription>Testfuncties voor ontwikkeling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Gebruikersrol wijzigen</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Gebruik deze knoppen om je rol te wijzigen voor test doeleinden. 
            Let op: bij wijziging zul je mogelijk opnieuw moeten inloggen.
          </p>
          
          <div className="flex space-x-2 mt-2">
            <Button 
              onClick={() => onRoleChange('medewerker')}
              disabled={isUpdating || role === 'medewerker'}
              variant={role === 'medewerker' ? 'default' : 'outline'}
            >
              Medewerker
            </Button>
            <Button 
              onClick={() => onRoleChange('super_admin')}
              disabled={isUpdating || role === 'super_admin'}
              variant={role === 'super_admin' ? 'default' : 'outline'}
            >
              Super Admin
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
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
          Deze functies zijn alleen beschikbaar in de ontwikkelomgeving.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DebugSettingsCard; 