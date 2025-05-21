import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client, IncidentType, IncidentLogWithRelations } from '@/lib/types';

export const useHomePageData = (userId: string | undefined) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | '' >('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingIncidentId, setLoggingIncidentId] = useState<number | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccessId, setLogSuccessId] = useState<number | null>(null);
  const [dailyLogs, setDailyLogs] = useState<IncidentLogWithRelations[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [editingLog, setEditingLog] = useState<{id: number, count: number} | null>(null);
  
  // Locaties (kunnen vanuit een aparte tabel komen in de toekomst)
  const locations = [
    'Woonkamer', 'Slaapkamer', 'Keuken', 'Badkamer', 
    'Tuin', 'Gang', 'Activiteitenruimte', 'Buiten', 'Anders'
  ];

  // Update huidige tijd
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toTimeString().slice(0, 5)); // Format HH:MM
  }, []);

  // Fetch basis gegevens
  const fetchTodaysLogs = useCallback(async () => {
    if (!userId) return;
    
    setLoadingLogs(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('incident_logs')
        .select(`
          id, created_at, log_date, count, user_id, client_id, incident_type_id, notes, location, severity, time_of_day, triggered_by, intervention_successful,
          client:client_id(full_name),
          incident_type:incident_type_id(name, category, severity_level, color_code, requires_notification)
        `)
        .eq('user_id', userId)
        .eq('log_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let logsData = data as unknown as IncidentLogWithRelations[] || [];
      if (logsData && logsData.length > 0) {
        logsData = logsData.map(log => {
          if (!log.client && log.client_id === '62713cf6-1b6e-43a6-9dec-2ff8c25b2b3e') {
            return { ...log, client: { full_name: 'A. Aberrazek' } };
          }
          return log;
        });
      }
      setDailyLogs(logsData);

    } catch (err: unknown) {
      console.error('Error fetching today\'s logs:', err);
      // setError('Kon dagelijkse logs niet laden: ' + (err instanceof Error ? err.message : String(err))); // Optioneel: error tonen
    } finally {
      setLoadingLogs(false);
    }
  }, [userId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Verwijder _directClient query, was ongebruikt
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, full_name, is_active, created_at')
        .order('full_name');

      if (clientsError) throw clientsError;
      
      let processedClients = clientsData?.filter(client => client.is_active !== false) || [];
      const hasAberrazek = processedClients.some(c => c.id === '62713cf6-1b6e-43a6-9dec-2ff8c25b2b3e');
      if (!hasAberrazek) {
        processedClients = [
          ...processedClients,
          { id: '62713cf6-1b6e-43a6-9dec-2ff8c25b2b3e', full_name: 'A. Aberrazek', is_active: true, created_at: '2025-04-07 16:57:52+00' }
        ];
      }
      setClients(processedClients);
      if (processedClients && processedClients.length === 1) {
        setSelectedClientId(processedClients[0].id);
      }

      const { data: typesData, error: typesError } = await supabase
        .from('incident_types')
        .select('id, name, description, is_active, created_at, category, severity_level, requires_notification, color_code')
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;
      setIncidentTypes(typesData || []);
      await fetchTodaysLogs();

    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      let errorMessage = 'Kon gegevens niet laden.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon gegevens niet laden: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchTodaysLogs]);

  // Laad data bij eerste render
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  // Handler voor selectie wijziging
  const handleClientChange = (value: string) => {
    setSelectedClientId(value);
    setLogError(null);
    setLogSuccessId(null);
  };

  // Handler voor locatie selectie
  const handleLocationChange = (value: string) => {
    setSelectedLocation(value === 'none' ? '' : value);
  };

  // Functie om een incident te loggen met de nieuwe velden
  const handleIncidentLog = useCallback(async (incidentTypeId: number) => {
    if (!selectedClientId || !userId) {
      setLogError('Selecteer eerst een cliënt en zorg dat u ingelogd bent.');
      return;
    }
    setLoggingIncidentId(incidentTypeId);
    setLogError(null);
    setLogSuccessId(null);
    const incidentType = incidentTypes.find(type => type.id === incidentTypeId);
    const severity = incidentType?.severity_level || null;
    try {
      const { error: insertError } = await supabase
        .from('incident_logs')
        .insert([{ client_id: selectedClientId, user_id: userId, incident_type_id: incidentTypeId, count: 1, location: selectedLocation || null, severity: severity, time_of_day: currentTime || null, intervention_successful: true }]);
      if (insertError) throw insertError;
      setLogSuccessId(incidentTypeId);
      setTimeout(() => setLogSuccessId(null), 1500);
      await fetchTodaysLogs();
    } catch (err: unknown) {
      console.error('Error logging incident:', err);
      let errorMessage = 'Kon incident niet loggen.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setLogError('Kon incident niet loggen: ' + errorMessage);
    } finally {
      setLoggingIncidentId(null);
    }
  }, [userId, selectedClientId, selectedLocation, currentTime, incidentTypes, fetchTodaysLogs]);

  // Functie om een registratie te verwijderen
  const handleDeleteLog = useCallback(async (logId: number) => {
    if (!userId) return;
    setDeletingLogId(logId);
    try {
      const { error } = await supabase.from('incident_logs').delete().eq('id', logId).eq('user_id', userId);
      if (error) throw error;
      setDailyLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err: unknown) {
      console.error('Error deleting log:', err);
      let errorMessage = 'Kon registratie niet verwijderen.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setLogError('Kon registratie niet verwijderen: ' + errorMessage);
    } finally {
      setDeletingLogId(null);
    }
  }, [userId]);

  // Functie om een log count aan te passen
  const handleUpdateLogCount = useCallback(async (logId: number, newCount: number) => {
    if (newCount < 1 || !userId) {
      setEditingLog(null);
      return;
    }
    try {
      setEditingLog({ id: logId, count: newCount });
      const { error } = await supabase.from('incident_logs').update({ count: newCount }).eq('id', logId).eq('user_id', userId);
      if (error) throw error;
      setDailyLogs(prev => prev.map(log => log.id === logId ? { ...log, count: newCount } : log ));
    } catch (err: unknown) {
      console.error('Error updating log count:', err);
      let errorMessage = 'Kon aantal niet bijwerken.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setLogError('Kon aantal niet bijwerken: ' + errorMessage);
    } finally {
      setEditingLog(null);
    }
  }, [userId]);

  // Helper functie om een combinatie sleutel te maken voor groupering
  const createRegistrationKey = (log: IncidentLogWithRelations) => {
    // Maak een sleutel op basis van de client + incident type + locatie + datum
    return `${log.client_id || 'client'}_${log.incident_type_id || 'type'}_${log.location || 'none'}_${log.log_date}`;
  };

  // Functie om logs te groeperen op client en incident type
  const groupLogsByClientAndType = (logs: IncidentLogWithRelations[]) => {
    const groupedLogs: {[key: string]: IncidentLogWithRelations[]} = {};
    
    logs.forEach(log => {
      const key = createRegistrationKey(log);
      if (!groupedLogs[key]) {
        groupedLogs[key] = [];
      }
      groupedLogs[key].push(log);
    });
    
    return Object.values(groupedLogs).map(logGroup => {
      // Maak één log met een gecombineerde telling
      const baseLog = { ...logGroup[0] };
      // Als er meer dan 1 log is, combineer de tellingen
      if (logGroup.length > 1) {
        baseLog.count = logGroup.reduce((total, log) => total + log.count, 0);
        // Voeg IDs van gecombineerde logs toe voor bewerkingen
        baseLog.combinedLogIds = logGroup.map(log => log.id);
      }
      return baseLog;
    });
  };

  // Update de datalogs voor het renderen
  const getGroupedDailyLogs = () => {
    return groupLogsByClientAndType(dailyLogs);
  };

  // Helper functies voor datum- en tijdformattering
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // Formaat HH:MM
  };

  // Maak een gegroepeerd resultaat voor weergave
  const groupedDailyLogs = getGroupedDailyLogs();

  return {
    clients,
    incidentTypes,
    selectedClientId,
    setSelectedClientId: handleClientChange,
    selectedLocation,
    setSelectedLocation: handleLocationChange,
    currentTime,
    loading,
    error,
    loggingIncidentId,
    logError,
    logSuccessId,
    groupedDailyLogs,
    loadingLogs,
    deletingLogId,
    editingLog,
    locations,
    handleIncidentLog,
    handleDeleteLog,
    handleUpdateLogCount,
    fetchTodaysLogs,
    fetchData,
    formatDate,
    formatTime
  };
};

export default useHomePageData; 