// @ts-nocheck

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { UserRole } from '@/lib/types';

const ProfilePage: React.FC = () => {
  const { user, userProfile, role, updateUserRole } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateUserRole(user.id, newRole);
      setSuccessMessage(`Rol succesvol bijgewerkt naar ${newRole}`);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het bijwerken van de rol');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Mijn Profiel</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gebruikersinformatie</CardTitle>
            <CardDescription>Je huidige profiel gegevens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">E-mailadres</h3>
              <p>{user?.email}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Gebruikers ID</h3>
              <p className="text-sm">{user?.id}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Naam</h3>
              <p>{userProfile?.full_name || 'Geen naam ingesteld'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Rol</h3>
              <p className="flex items-center">
                <span className={role === 'super_admin' ? 'font-semibold text-primary' : ''}>
                  {role === 'super_admin' ? 'Super Admin' : 'Medewerker'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

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
                  onClick={() => handleRoleChange('medewerker')}
                  disabled={isUpdating || role === 'medewerker'}
                  variant={role === 'medewerker' ? 'default' : 'outline'}
                >
                  Medewerker
                </Button>
                <Button 
                  onClick={() => handleRoleChange('super_admin')}
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

        <Card>
          <CardHeader>
            <CardTitle>Debug Informatie</CardTitle>
            <CardDescription>Technische details voor ontwikkelaars</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
              {JSON.stringify({ 
                user: { 
                  id: user?.id,
                  email: user?.email,
                },
                profile: userProfile,
                role: role,
                isSuperAdmin: role === 'super_admin'
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage; 