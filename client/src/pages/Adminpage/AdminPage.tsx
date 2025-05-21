import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from 'lucide-react';
import { UsersTab, StatisticsTab, SettingsTab } from './components';
import useAdminData from './hooks/useAdminData';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from '@/lib/types';

interface AdminPageUserProfile {
  id: string;
  email?: string | null;
  role: UserRole;
  updated_at?: string | null;
  full_name: string | null;
}

const AdminPage: React.FC = () => {
  const { userProfile, signOut } = useAuthStore();
  const [users, setUsers] = useState<AdminPageUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useAdminData();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, email, role, updated_at, full_name');
          
        if (fetchError) throw fetchError;

        const processedUsers = (data || [])
          .map(u => ({
            id: u.id as string,
            email: (u.email === undefined ? null : u.email) as string | null | undefined,
            role: u.role as UserRole,
            updated_at: (u.updated_at === undefined ? null : u.updated_at) as string | null | undefined,
            full_name: (u.full_name === undefined ? null : u.full_name) as string | null,
          }))
          .filter(u => u.role && typeof u.role === 'string' && (u.role === 'medewerker' || u.role === 'super_admin'))
          setUsers(processedUsers as AdminPageUserProfile[]);

      } catch (err: unknown) {
        console.error('Error fetching users:', err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      } else {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      navigate('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Kon niet uitloggen: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
        <div className="flex items-center mb-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="mr-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Terug
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Beheer</h1>
        </div>
        <div className="text-center py-8">Gegevens laden...</div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Geen toegang</h2>
          <p className="text-muted-foreground">
            {!userProfile 
              ? "Je bent niet ingelogd of er is een probleem met je gebruikersprofiel."
              : "Je hebt geen admin rechten om deze pagina te bekijken."}
          </p>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="mt-4"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link to="/" className="absolute top-4 left-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <Button 
          variant="outline" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Uitloggen
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="font-bold">Fout:</span> {error}
        </div>
      )}
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="statistics">Statistieken</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UsersTab users={users} setUsers={setUsers} setError={setError} />
        </TabsContent>
        
        <TabsContent value="statistics">
          <StatisticsTab setError={setError} />
        </TabsContent>
        
        <TabsContent value="settings">
          <SettingsTab setError={setError} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage; 