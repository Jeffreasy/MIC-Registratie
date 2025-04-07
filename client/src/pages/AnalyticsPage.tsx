// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Calendar, Users, AlertTriangle, MapPin, Clock, BarChart2 } from 'lucide-react';
import { Client, IncidentLogWithRelations, MonthlySummary, DailyTotal } from '@/lib/types';

// Component for date range picker
const DateRangePicker: React.FC<{
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="flex items-center gap-1">
        <label htmlFor="start-date" className="text-sm whitespace-nowrap">Van:</label>
        <Input
          type="date"
          id="start-date"
          className="max-w-[200px]"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="end-date" className="text-sm whitespace-nowrap">Tot:</label>
        <Input
          type="date"
          id="end-date"
          className="max-w-[200px]"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [logs, setLogs] = useState<IncidentLogWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);

  // Laad gegevens wanneer component laadt of datums/filters veranderen
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Haal cliënten op
        const { data: _clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, full_name, is_active, created_at')
          .eq('is_active', true)
          .order('full_name');
          
        if (clientsError) throw clientsError;
        setClients(_clients || []);
        
        // 2. Haal logs op met relatiegegevens
        const { data: logsData, error: logsError } = await supabase
          .from('incident_logs')
          .select(`
            id, 
            created_at,
            log_date,
            count,
            user_id,
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
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: false });
          
        if (logsError) throw logsError;
        setLogs(logsData as unknown as IncidentLogWithRelations[] || []);

        // 3. Haal maandelijkse samenvatting op uit de speciale view
        const { data: _monthlyData, error: monthlyError } = await supabase
          .from('monthly_summary')
          .select('*')
          .eq('user_id', user.id)
          .gte('month', startDate.substring(0, 7) + '-01') // Format to YYYY-MM-DD for timestamp compatibility
          .lte('month', endDate.substring(0, 7) + '-01')
          .order('month');

        if (monthlyError) throw monthlyError;
        setMonthlyData(_monthlyData || []);

        // 4. Haal dagelijkse totalen op via materialized view
        const { data: _dailyTotals, error: dailyError } = await supabase
          .from('daily_totals')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date');

        if (dailyError) throw dailyError;
        setDailyTotals(_dailyTotals || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Kon gegevens niet laden: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, startDate, endDate]);

  // Helper voor het formattteren van een datum
  const formatDate = (dateString: string) => {
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
  
  // Helper voor het formatten van een maand
  const _formatMonth = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString + '-01').toLocaleDateString('nl-NL', options);
  };

  // Groepeer logboekitems per incident type
  const getIncidentTypeTotals = () => {
    const totals: {[key: string]: {
      count: number;
      category: string | null;
      color: string;
    }} = {};
    
    logs.forEach(log => {
      const typeName = log.incident_type.name;
      
      if (totals[typeName]) {
        totals[typeName].count += log.count;
      } else {
        // Default kleur toewijzen op basis van category
        let color = '#a3a3a3'; // Grijs default
        if (log.incident_type.color_code) {
          color = log.incident_type.color_code;
        } else if (log.incident_type.category === 'fysiek') {
          color = '#ef4444'; // Rood
        } else if (log.incident_type.category === 'verbaal') {
          color = '#3b82f6'; // Blauw
        } else if (log.incident_type.category === 'emotioneel') {
          color = '#eab308'; // Geel
        } else if (log.incident_type.category === 'sociaal') {
          color = '#22c55e'; // Groen
        }
        
        totals[typeName] = {
          count: log.count,
          category: log.incident_type.category,
          color
        };
      }
    });
    
    // Sorteer op aantal (hoogste eerst)
    return Object.entries(totals)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Groepeer per locatie
  const getLocationTotals = () => {
    const totals: {[key: string]: number} = {};
    
    logs.forEach(log => {
      const location = log.location || 'Onbekend';
      
      if (totals[location]) {
        totals[location] += log.count;
      } else {
        totals[location] = log.count;
      }
    });
    
    // Sorteer op aantal (hoogste eerst)
    return Object.entries(totals)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Groepeer per tijd van de dag (per uur)
  const getTimeOfDayTotals = () => {
    const totals: {[key: string]: number} = {};
    
    // Initialiseer alle uren
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      totals[hour] = 0;
    }
    
    logs.forEach(log => {
      if (log.time_of_day) {
        const hour = log.time_of_day.substring(0, 2);
        totals[hour] += log.count;
      }
    });
    
    // Converteer naar array voor chart
    return Object.entries(totals)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
      }));
  };

  // Groepeer per categorie
  const getCategoryTotals = () => {
    const totals: {[key: string]: {count: number, color: string}} = {
      'fysiek': {count: 0, color: '#ef4444'},
      'verbaal': {count: 0, color: '#3b82f6'},
      'emotioneel': {count: 0, color: '#eab308'},
      'sociaal': {count: 0, color: '#22c55e'},
      'overig': {count: 0, color: '#a3a3a3'}
    };
    
    logs.forEach(log => {
      const category = log.incident_type.category || 'overig';
      if (totals[category]) {
        totals[category].count += log.count;
      } else {
        totals['overig'].count += log.count;
      }
    });
    
    // Converteer naar array voor chart
    return Object.entries(totals)
      .map(([category, data]) => ({
        name: getCategoryName(category),
        count: data.count,
        color: data.color
      }))
      .filter(item => item.count > 0);
  };

  // Groepeer per client
  const getClientTotals = () => {
    const totals: {[key: string]: number} = {};
    
    logs.forEach(log => {
      const clientName = log.client.full_name;
      
      if (totals[clientName]) {
        totals[clientName] += log.count;
      } else {
        totals[clientName] = log.count;
      }
    });
    
    // Sorteer op aantal (hoogste eerst)
    return Object.entries(totals)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Helper voor het omzetten van categorieën naar menselijke namen
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'fysiek': return 'Fysiek';
      case 'verbaal': return 'Verbaal';
      case 'emotioneel': return 'Emotioneel';
      case 'sociaal': return 'Sociaal';
      case 'overig': 
      default: return 'Overig';
    }
  };

  // Bereid data voor voor grafiek weergave
  const incidentTypesData = getIncidentTypeTotals();
  const locationData = getLocationTotals();
  const timeOfDayData = getTimeOfDayTotals();
  const categoryData = getCategoryTotals();
  const clientData = getClientTotals();

  // Bereken totalen
  const totalIncidents = logs.reduce((sum, log) => sum + log.count, 0);
  const uniqueClients = new Set(logs.map(log => log.client.full_name)).size;
  const uniqueDays = new Set(logs.map(log => log.log_date)).size;
  
  // Helper voor het tonen van interventie succesvol percentage
  const getInterventionSuccessRate = () => {
    const totalInterventions = logs.length;
    const successfulInterventions = logs.filter(log => log.intervention_successful).length;
    
    if (totalInterventions === 0) return 0;
    return Math.round((successfulInterventions / totalInterventions) * 100);
  };

  // Toon laadstatus
  if (loading) {
    return (
      <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
        <div className="flex items-center mb-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Terug
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Mijn Registraties</h1>
        </div>
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
        <div className="flex items-center mb-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Terug
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Mijn Registraties</h1>
        </div>
        <div className="text-destructive text-center py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 container mx-auto bg-background text-foreground">
      {/* Header met terug knop */}
      <div className="flex items-center mb-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Terug
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Mijn Registraties</h1>
      </div>
      
      {/* Datum filter */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Periode selecteren</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </CardContent>
      </Card>
      
      {/* Overzicht statistieken */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4 flex items-center">
            <BarChart2 className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Incidenten</p>
              <p className="text-2xl font-bold">{totalIncidents}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <Users className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliënten</p>
              <p className="text-2xl font-bold">{uniqueClients}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dagen</p>
              <p className="text-2xl font-bold">{uniqueDays}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <AlertTriangle className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interventie succesvol</p>
              <p className="text-2xl font-bold">{getInterventionSuccessRate()}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Geen incidenten gevonden voor de geselecteerde periode.
        </div>
      ) : (
        <>
          {/* Grafieken en statistieken */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Incident Types Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Incidenten per type</CardTitle>
                <CardDescription>Top 10 incident types</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incidentTypesData.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={75} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Aantal" radius={[0, 4, 4, 0]}>
                      {incidentTypesData.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Categorieën Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Incidenten per categorie</CardTitle>
                <CardDescription>Verdeling over categorieën</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Locaties Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Incidenten per locatie</CardTitle>
                <CardDescription>Waar gebeuren incidenten?</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationData.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={75} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Aantal" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Tijd van dag Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Incidenten per uur</CardTitle>
                <CardDescription>Wanneer gebeuren incidenten?</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeOfDayData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" angle={-45} textAnchor="end" height={50} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Aantal" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Recente Logs Tabel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recente registraties</CardTitle>
              <CardDescription>De laatste 20 geregistreerde incidenten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Datum</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Cliënt</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Incident</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Categorie</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Locatie</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Tijd</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Aantal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 20).map(log => (
                      <tr key={log.id} className="border-b border-border/30 hover:bg-muted/50">
                        <td className="py-2">{formatDate(log.log_date)}</td>
                        <td className="py-2">{log.client.full_name}</td>
                        <td className="py-2">
                          <div className="flex items-center">
                            <span className="h-2 w-2 rounded-full mr-2" 
                              style={{ 
                                backgroundColor: log.incident_type.color_code || 
                                  (log.incident_type.category === 'fysiek' ? '#ef4444' : 
                                  (log.incident_type.category === 'verbaal' ? '#3b82f6' : 
                                  (log.incident_type.category === 'emotioneel' ? '#eab308' : 
                                  (log.incident_type.category === 'sociaal' ? '#22c55e' : '#a3a3a3')))) 
                              }} 
                            />
                            {log.incident_type.name}
                            {log.incident_type.requires_notification && (
                              <AlertTriangle className="h-3 w-3 ml-1 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-2">
                          {log.incident_type.category ? getCategoryName(log.incident_type.category) : '-'}
                        </td>
                        <td className="py-2">
                          {log.location ? (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                              {log.location}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2">
                          {log.time_of_day ? (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                              {formatTime(log.time_of_day)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 text-right font-medium">{log.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage; 