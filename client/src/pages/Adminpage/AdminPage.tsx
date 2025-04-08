// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from 'lucide-react';
import { ClientsTab, IncidentsTab, UsersTab, StatisticsTab, SettingsTab } from './components';
import useAdminData from './hooks/useAdminData';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import UserManagementTab from './components/UserManagementTab';
import ClientManagementTab from './components/ClientManagementTab';
import IncidentTypesTab from './components/IncidentTypesTab';

type AdminTab = 'clients' | 'incidents' | 'users';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  updated_at: string;
  full_name?: string;
}

const AdminPage: React.FC = () => {
  const { user, userProfile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Gebruik de custom hook voor data management
  const {
    clients,
    setClients,
    incidentTypes,
    setIncidentTypes,
    setError: useAdminDataError,
  } = useAdminData();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role, updated_at, full_name');
          
        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message);
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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      navigate('/login');
    } catch (error: any) {
      setError(`Kon niet uitloggen: ${error.message}`);
    }
  };
  
  // Tab navigation component
  const TabButton: React.FC<{
    tab: AdminTab;
    label: string;
  }> = ({ tab, label }) => (
    <button
      className={`px-3 py-2 ${
        activeTab === tab
          ? 'border-b-2 border-primary font-medium text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );

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
        <Button 
          variant="outline" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Uitloggen
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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