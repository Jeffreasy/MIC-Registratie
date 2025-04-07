import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from '@supabase/supabase-js';

interface UserInfoCardProps {
  user: User | null;
  userProfile: any;
  role: string | null;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, userProfile, role }) => {
  return (
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
  );
};

export default UserInfoCard; 