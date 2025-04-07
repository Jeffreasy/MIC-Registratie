// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/themetoggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trash2, Edit2, RefreshCw, MapPin, Clock, AlertTriangle } from "lucide-react";
import { IncidentType, Client, IncidentLogWithRelations, IncidentTypeWithTotals } from '@/lib/types';

const HomePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
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
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Haal actieve cliënten op
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, full_name, is_active, created_at')
          .eq('is_active', true)
          .order('full_name'); // Sorteer op naam

        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Haal actieve incident types op met de nieuwe velden
        const { data: typesData, error: typesError } = await supabase
          .from('incident_types')
          .select('id, name, description, is_active, created_at, category, severity_level, requires_notification, color_code')
          .eq('is_active', true)
          .order('name'); // Sorteer op naam

        if (typesError) throw typesError;
        setIncidentTypes(typesData || []);

        // Haal de registraties van vandaag op
        await fetchTodaysLogs();

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Kon gegevens niet laden: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Lege dependency array zorgt ervoor dat dit alleen bij mount draait

  // Functie om de logs van vandaag op te halen
  const fetchTodaysLogs = async () => {
    if (!user) return;
    
    setLoadingLogs(true);
    try {
      // Huidige datum in YYYY-MM-DD formaat
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('incident_logs')
        .select(`
          id, 
          created_at,
          log_date,
          count,
          user_id,
          client_id,
          incident_type_id,
          notes,
          location,
          severity,
          time_of_day,
          triggered_by,
          intervention_successful,
          client:client_id(full_name),
          incident_type:incident_type_id(name, category, severity_level, color_code, requires_notification)
        `)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDailyLogs(data as unknown as IncidentLogWithRelations[] || []);
    } catch (err: any) {
      console.error('Error fetching today\'s logs:', err);
      // We tonen geen foutmelding omdat dit secondair is
    } finally {
      setLoadingLogs(false);
    }
  };

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
  const handleIncidentLog = async (incidentTypeId: number) => {
    if (!selectedClientId || !user) {
      setLogError('Selecteer eerst een cliënt en zorg dat u ingelogd bent.');
      return;
    }

    setLoggingIncidentId(incidentTypeId);
    setLogError(null);
    setLogSuccessId(null);

    // Zoek het incident type voor de severity_level
    const incidentType = incidentTypes.find(type => type.id === incidentTypeId);
    const severity = incidentType?.severity_level || null;

    try {
      const { error: insertError } = await supabase
        .from('incident_logs')
        .insert([
          {
            client_id: selectedClientId,
            user_id: user.id,
            incident_type_id: incidentTypeId,
            count: 1, // Standaard count is 1
            location: selectedLocation || null,
            severity: severity,
            time_of_day: currentTime || null,
            intervention_successful: true, // Standaard waarde
            // log_date wordt automatisch door de database ingesteld (DEFAULT CURRENT_DATE)
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // Toon kort succes feedback
      setLogSuccessId(incidentTypeId);
      setTimeout(() => setLogSuccessId(null), 1500); // Verberg na 1.5s

      // Werk de dagelijkse logs bij om de nieuwe toe te voegen
      await fetchTodaysLogs();

    } catch (err: any) {
      console.error('Error logging incident:', err);
      setLogError('Kon incident niet loggen: ' + err.message);
    } finally {
      setLoggingIncidentId(null);
    }
  };

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

  // Gebruik deze voor rendering
  const groupedDailyLogs = getGroupedDailyLogs();

  // Functie om een registratie te verwijderen
  const handleDeleteLog = async (logId: number) => {
    if (!user) return;
    
    setDeletingLogId(logId);
    try {
      // Haal de log op om te zien of het een gecombineerde log is
      const logToDelete = groupedDailyLogs.find(log => log.id === logId);
      
      if (logToDelete && 'combinedLogIds' in logToDelete) {
        // Als het een gecombineerde log is, verwijder alle logs
        const combinedIds = logToDelete.combinedLogIds as number[];
        
        // Verwijder elk log individueel
        for (const id of combinedIds) {
          await supabase
            .from('incident_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }
        
        // Update de lijst na verwijderen
        setDailyLogs(prevLogs => prevLogs.filter(log => !combinedIds.includes(log.id)));
      } else {
        // Anders gewoon één log verwijderen zoals voorheen
        const { error } = await supabase
          .from('incident_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update de lijst na verwijderen
        setDailyLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      }
    } catch (err: any) {
      console.error('Error deleting log:', err);
    } finally {
      setDeletingLogId(null);
    }
  };

  // Functie om een registratie te updaten (aantal wijzigen)
  const handleUpdateLogCount = async (logId: number, newCount: number) => {
    if (!user || newCount < 1) return;
    
    setEditingLog({id: logId, count: newCount});
    try {
      // Haal de log op om te zien of het een gecombineerde log is
      const logToUpdate = groupedDailyLogs.find(log => log.id === logId);
      
      if (logToUpdate && 'combinedLogIds' in logToUpdate) {
        // Als het een gecombineerde log is, bewerk de eerste log en verwijder de rest
        const combinedIds = logToUpdate.combinedLogIds as number[];
        const firstId = combinedIds[0];
        
        // Update de eerste log met het nieuwe aantal
        const { error: updateError } = await supabase
          .from('incident_logs')
          .update({ count: newCount })
          .eq('id', firstId)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
        
        // Verwijder de overige logs
        for (const id of combinedIds.slice(1)) {
          await supabase
            .from('incident_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }
        
        // Haal de logs opnieuw op na bewerking
        await fetchTodaysLogs();
      } else {
        // Anders gewoon één log bijwerken zoals voorheen
        const { error } = await supabase
          .from('incident_logs')
          .update({ count: newCount })
          .eq('id', logId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update de lijst met het nieuwe aantal
        setDailyLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === logId ? {...log, count: newCount} : log
          )
        );
      }
    } catch (err: any) {
      console.error('Error updating log count:', err);
    } finally {
      setEditingLog(null);
    }
  };

  // Toon laadstatus
  if (loading) {
    return (
      <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
        <div className="text-center py-8">
          <div className="animate-pulse">Gegevens laden...</div>
        </div>
      </div>
    );
  }

  // Toon foutmelding
  if (error) {
    return (
      <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
        <div className="text-destructive text-center py-8">{error}</div>
      </div>
    );
  }

  // Formateer datum voor weergave
  const _formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
  };

  // Formateer tijd voor weergave
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // Formaat HH:MM
  };

  // Bereken de aantallen per incidenttype
  const calculateTotalsByType = () => {
    // Verzamel alle totalen per incidenttype
    const totals: {[key: string]: {
      count: number, 
      logs: IncidentLogWithRelations[],
      category: string | null,
      severity_level: number | null,
      color_code: string | null
    }} = {};
    
    // Initialiseer alle beschikbare incidenttypes met 0 (zelfs als ze niet in de logs voorkomen)
    incidentTypes.forEach(type => {
      totals[type.name] = {
        count: 0, 
        logs: [],
        category: type.category,
        severity_level: type.severity_level,
        color_code: type.color_code
      };
    });
    
    // Tel het aantal per incidenttype en bewaar de logs
    dailyLogs.forEach(log => {
      const typeName = log.incident_type.name;
      if (totals[typeName]) {
        totals[typeName].count += log.count;
        totals[typeName].logs.push(log);
      } else {
        totals[typeName] = {
          count: log.count, 
          logs: [log],
          category: log.incident_type.category,
          severity_level: log.incident_type.severity_level,
          color_code: log.incident_type.color_code
        };
      }
    });
    
    // Sorteer eerst op categorie, dan op naam
    return Object.entries(totals)
      .map(([name, data]) => ({
        name,
        count: data.count,
        logs: data.logs,
        category: data.category,
        severity_level: data.severity_level,
        color_code: data.color_code
      }))
      .sort((a, b) => {
        // Eerst op categorie
        if (a.category !== b.category) {
          return (a.category || '') < (b.category || '') ? -1 : 1;
        }
        // Dan op naam
        return a.name.localeCompare(b.name);
      });
  };

  const incidentTypeTotals = calculateTotalsByType();

  // Categorie groepering voor de weergave
  const groupByCategory = (incidents: IncidentTypeWithTotals[]) => {
    const groups: {[key: string]: IncidentTypeWithTotals[]} = {
      'fysiek': [],
      'verbaal': [],
      'emotioneel': [],
      'sociaal': [],
      'overig': []
    };

    incidents.forEach(incident => {
      const category = incident.category || 'overig';
      if (groups[category]) {
        groups[category].push(incident);
      } else {
        groups['overig'].push(incident);
      }
    });

    return groups;
  };

  const categorizedIncidents = groupByCategory(incidentTypeTotals);

  // Helper functie voor de kleur op basis van severity of color_code
  const getIncidentTypeColor = (incident: IncidentTypeWithTotals) => {
    if (incident.color_code) return incident.color_code;
    
    // Fallback kleuren op basis van severity
    if (incident.severity_level === 5) return '#ef4444'; // Rood
    if (incident.severity_level === 4) return '#f97316'; // Oranje
    if (incident.severity_level === 3) return '#eab308'; // Geel
    if (incident.severity_level === 2) return '#3b82f6'; // Blauw
    if (incident.severity_level === 1) return '#22c55e'; // Groen
    
    return '#a3a3a3'; // Grijs als fallback
  };

  // UI helper voor het renderen van een categorie naam
  const renderCategoryName = (category: string) => {
    switch(category) {
      case 'fysiek': return 'Fysiek';
      case 'verbaal': return 'Verbaal';
      case 'emotioneel': return 'Emotioneel';
      case 'sociaal': return 'Sociaal';
      default: return 'Overig';
    }
  };

  return (
    <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Incident Registratie</h1>
      
      {/* Client & Locatie Selectie - full width op mobiel */} 
      <div className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Client Selector */}
        <div className="w-full"> 
          <label htmlFor="client-select" className="block text-sm font-medium mb-1">
            Selecteer Cliënt:
          </label>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger id="client-select" className="w-full bg-card border-input text-foreground">
              <SelectValue placeholder="-- Kies een cliënt --" />
            </SelectTrigger>
            <SelectContent 
              style={{ 
                backgroundColor: 'var(--card)', 
                color: 'var(--card-foreground)',
                borderColor: 'var(--border)',
                zIndex: 50 
              }} 
              position="popper"
              sideOffset={5}
              className="border-2 shadow-md max-w-[var(--radix-select-trigger-width)] w-full"
            >
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Locatie Selector */}
        <div className="w-full">
          <label htmlFor="location-select" className="block text-sm font-medium mb-1">
            Locatie (optioneel):
          </label>
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger id="location-select" className="w-full bg-card border-input text-foreground">
              <SelectValue placeholder="-- Kies een locatie --" />
            </SelectTrigger>
            <SelectContent 
              style={{ 
                backgroundColor: 'var(--card)', 
                color: 'var(--card-foreground)',
                borderColor: 'var(--border)',
                zIndex: 50 
              }} 
              position="popper"
              sideOffset={5}
              className="border-2 shadow-md max-w-[var(--radix-select-trigger-width)] w-full"
            >
              <SelectItem value="none">Geen locatie</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incident Knoppen/Registratie Sectie */}
      {selectedClientId && (
        <Card className="mb-4"> 
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">
              Registreer incident voor: 
              <span className="block mt-1 font-medium text-muted-foreground">
                {clients.find(c => c.id === selectedClientId)?.full_name}
              </span>
              
              {selectedLocation && (
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedLocation}
                  
                  {currentTime && (
                    <span className="flex items-center ml-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentTime}
                    </span>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logError && <p className="text-destructive mb-4 text-sm">{logError}</p>}
            
            {/* Per categorie de incident types tonen */}
            <div className="space-y-4">
              {Object.entries(categorizedIncidents).map(([category, incidents]) => 
                incidents.length > 0 && (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      {renderCategoryName(category)}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                      {incidents.map((type) => {
                        const isLoading = loggingIncidentId === incidentTypes.find(t => t.name === type.name)?.id;
                        const isSuccess = logSuccessId === incidentTypes.find(t => t.name === type.name)?.id;
                        const color = getIncidentTypeColor(type);
                        const originalType = incidentTypes.find(t => t.name === type.name);
                        
                        return (
                          <Button
                            key={type.name}
                            variant={isLoading ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleIncidentLog(originalType?.id || 0)}
                            disabled={isLoading || !!loggingIncidentId || !originalType}
                            className={`transition duration-150 ease-in-out w-full py-6 text-sm h-auto ${isSuccess ? 'bg-green-500 hover:bg-green-600 text-white' : ''} ${isLoading ? 'cursor-not-allowed' : ''}`}
                            style={{
                              backgroundColor: !isLoading && !isSuccess ? color : undefined,
                              color: !isLoading && !isSuccess && color !== '#a3a3a3' ? '#fff' : undefined,
                              borderColor: color,
                            }}
                          >
                            {isLoading ? 'Bezig...' : isSuccess ? 'Gelukt! ✔' : type.name}
                            {originalType?.requires_notification && (
                              <AlertTriangle className="h-3 w-3 text-white" />
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClientId && clients.length > 0 && (
        <p className="text-muted-foreground mt-4 text-center text-sm">Selecteer een cliënt om incidenten te registreren.</p>
      )}

      {clients.length === 0 && !loading && (
         <p className="text-orange-500 mt-4 text-center">Geen actieve cliënten gevonden.</p>
      )}

      {/* Sectie met de registraties van vandaag */}
      <Card className="mt-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Vandaag geregistreerd</CardTitle>
            <CardDescription>
              Registraties van {new Date().toLocaleDateString('nl-NL')}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={fetchTodaysLogs}
            disabled={loadingLogs}
          >
            <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span className="sr-only">Vernieuwen</span>
          </Button>
        </CardHeader>
        <CardContent>
          {dailyLogs.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm py-4">
              {loadingLogs ? 'Laden...' : 'Geen registraties vandaag.'}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Mobiele weergave: Lijst voor elk incidenttype */}
              <div className="sm:hidden space-y-3">
                {incidentTypeTotals.map((typeData) => (
                  <div key={typeData.name} className={`bg-card/50 border-l-4 border rounded-md p-3 ${typeData.count === 0 ? 'opacity-60' : ''}`} 
                    style={{ borderLeftColor: getIncidentTypeColor(typeData) }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{typeData.name}</span>
                        {typeData.category && (
                          <span className="text-xs ml-2 text-muted-foreground">
                            {renderCategoryName(typeData.category)}
                          </span>
                        )}
                      </div>
                      <span className={`font-semibold text-lg ${typeData.count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {typeData.count}
                      </span>
                    </div>
                    
                    {typeData.logs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-1">Details:</p>
                        {groupLogsByClientAndType(typeData.logs).map(log => (
                          <div key={log.id} className="flex justify-between items-center text-xs my-1">
                            <div className="flex items-center">
                              <span>{log.client.full_name}</span>
                              {log.location && (
                                <span className="ml-2 flex items-center text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {log.location}
                                </span>
                              )}
                              {log.time_of_day && (
                                <span className="ml-2 flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(log.time_of_day)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>{log.count}x</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingLog(editingLog?.id === log.id ? null : {id: log.id, count: log.count});
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLog(log.id)}
                                disabled={deletingLogId === log.id}
                              >
                                {deletingLogId === log.id ? (
                                  <div className="h-3 w-3 border-t-2 border-r-2 border-destructive animate-spin rounded-full" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {editingLog && typeData.logs.some(log => log.id === editingLog.id) && (
                      <div className="mt-2 pt-2 border-t border-border/30 flex justify-center">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 min-w-0"
                            onClick={() => handleUpdateLogCount(editingLog.id, Math.max(1, editingLog.count - 1))}
                          >
                            -
                          </Button>
                          <span className="w-5 text-center">{editingLog.count}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 min-w-0"
                            onClick={() => handleUpdateLogCount(editingLog.id, editingLog.count + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Desktop weergave: Tabel met alle incidenttypes */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Incident Type</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Categorie</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Aantal</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentTypeTotals.map((typeData) => (
                      <tr key={typeData.name} className={`border-b border-border/30 hover:bg-muted/50 ${typeData.count === 0 ? 'text-muted-foreground' : ''}`}>
                        <td className="py-2 font-medium" style={{ borderLeft: `4px solid ${getIncidentTypeColor(typeData)}`, paddingLeft: '8px' }}>
                          {typeData.name}
                          {typeData.logs.some(l => l.incident_type.requires_notification) && (
                            <AlertTriangle className="h-3 w-3 ml-1 inline-block text-yellow-500" />
                          )}
                        </td>
                        <td className="py-2">
                          {typeData.category ? renderCategoryName(typeData.category) : '-'}
                        </td>
                        <td className="py-2 text-center font-semibold">{typeData.count}</td>
                        <td className="py-2">
                          {typeData.logs.length > 0 ? (
                            <div className="flex flex-col items-end space-y-1">
                              {groupLogsByClientAndType(typeData.logs).map(log => (
                                <div key={log.id} className="flex items-center justify-end space-x-2">
                                  <div className="text-xs flex items-center">
                                    <span>{log.client.full_name}: {log.count}x</span>
                                    {log.location && (
                                      <span className="ml-2 flex items-center text-muted-foreground">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {log.location}
                                      </span>
                                    )}
                                    {log.time_of_day && (
                                      <span className="ml-2 flex items-center text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatTime(log.time_of_day)}
                                      </span>
                                    )}
                                  </div>
                                  {editingLog?.id === log.id ? (
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 p-0 min-w-0"
                                        onClick={() => handleUpdateLogCount(log.id, Math.max(1, editingLog.count - 1))}
                                      >
                                        -
                                      </Button>
                                      <span className="w-5 text-center text-xs">{editingLog.count}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 p-0 min-w-0"
                                        onClick={() => handleUpdateLogCount(log.id, editingLog.count + 1)}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          setEditingLog({id: log.id, count: log.count});
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteLog(log.id)}
                                        disabled={deletingLogId === log.id}
                                      >
                                        {deletingLogId === log.id ? (
                                          <div className="h-3 w-3 border-t-2 border-r-2 border-destructive animate-spin rounded-full" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-right block text-muted-foreground text-xs">Geen registraties</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage; 