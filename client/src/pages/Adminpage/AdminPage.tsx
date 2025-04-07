// @ts-nocheck

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { ClientsTab, IncidentsTab, UsersTab } from './components';
import useAdminData from './hooks/useAdminData';

type AdminTab = 'clients' | 'incidents' | 'users';

const AdminPage: React.FC = () => {
  const { user, userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  
  // Gebruik de custom hook voor data management
  const {
    clients,
    setClients,
    incidentTypes,
    setIncidentTypes,
    users,
    setUsers,
    loading,
    error,
    setError
  } = useAdminData();

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

  return (
    <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
      {/* Header met terug knop */}
      <div className="flex items-center mb-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="mr-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Terug
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Beheer</h1>
      </div>
      
      {error && <div className="text-destructive mb-4">{error}</div>}
      
      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-2">
          <TabButton tab="clients" label="Cliënten" />
          <TabButton tab="incidents" label="Incident Types" />
          <TabButton tab="users" label="Gebruikers" />
        </div>
      </div>
      
      {/* Tab content */}
      {activeTab === 'clients' && (
        <ClientsTab 
          clients={clients} 
          setClients={setClients} 
          setError={setError} 
        />
      )}
      
      {activeTab === 'incidents' && (
        <IncidentsTab 
          incidentTypes={incidentTypes} 
          setIncidentTypes={setIncidentTypes} 
          setError={setError} 
        />
      )}
      
      {activeTab === 'users' && (
        <UsersTab 
          users={users} 
          setUsers={setUsers} 
          setError={setError} 
        />
      )}
    </div>
  );
};

export default AdminPage; 