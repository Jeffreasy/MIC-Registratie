import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile, Client, IncidentType } from '@/lib/types';

export const useAdminData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('full_name');
          
        if (clientsError) throw clientsError;
        setClients(clientsData || []);
        
        // Fetch incident types
        const { data: typesData, error: typesError } = await supabase
          .from('incident_types')
          .select('*')
          .order('name');
          
        if (typesError) throw typesError;
        setIncidentTypes(typesData || []);
        
        // Fetch users (profiles)
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');
          
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError('Kon gegevens niet laden: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return {
    clients,
    setClients,
    incidentTypes,
    setIncidentTypes,
    users,
    setUsers,
    loading,
    error,
    setError
  };
};

export default useAdminData; 