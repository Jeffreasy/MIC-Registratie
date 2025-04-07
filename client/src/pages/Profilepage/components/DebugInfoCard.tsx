import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from '@supabase/supabase-js';

interface DebugInfoCardProps {
  user: User | null;
  userProfile: any;
  role: string | null;
}

const DebugInfoCard: React.FC<DebugInfoCardProps> = ({ user, userProfile, role }) => {
  return (
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
  );
};

export default DebugInfoCard; 