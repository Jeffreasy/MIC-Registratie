import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabaseClient';
import { 
  exportData, 
  quickExportToJson,
  DateRange,
  ColumnConfig,
  ExportFormat
} from '@/utils/dataExportService';
import { getStartOfMonth, getStartOfYear } from '@/utils/dateUtils';

interface SettingsTabProps {
  setError: (error: string | null) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ setError }) => {
  // UI Instellingen
  const [darkMode, setDarkMode] = useState<boolean>(
    document.documentElement.classList.contains('dark')
  );
  const [accentColor, setAccentColor] = useState<string>('blue');
  
  // Notificatie Instellingen
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [criticalAlerts, setCriticalAlerts] = useState<boolean>(true);
  const [summaryReports, setSummaryReports] = useState<boolean>(false);
  
  // Systeem Instellingen
  const [sessionTimeout, setSessionTimeout] = useState<string>("30");
  const [backupFrequency, setBackupFrequency] = useState<string>("weekly");
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // Functie voor thema omschakelen
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };
  
  // Accent kleur veranderen
  const changeAccentColor = (color: string) => {
    // Hier zou code komen om variabelen in te stellen voor het kleurenschema
    setAccentColor(color);
  };
  
  // Instellingen opslaan
  const saveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      // In een echte app zou je settings opslaan in de database
      // Dit is een voorbeeld implementatie
      
      // Simuleer API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Toon succes feedback
      setSaveSuccess(true);
      
      // Verberg succes feedback na 3 seconden
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      let errorMessage = 'Kon instellingen niet opslaan.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon instellingen niet opslaan: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Data export functie met periode
  const handleDataExport = async (format: ExportFormat, period: 'all' | 'month' | 'year') => {
    setLoading(true);
    
    try {
      // Query bouwen op basis van periode selectie
      const query = supabase
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
          client:client_id(id, full_name),
          incident_type:incident_type_id(id, name, category)
        `)
        .order('created_at', { ascending: false });
      
      // Data ophalen
      const { data, error } = await query;
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        alert('Geen data gevonden voor export.');
        setLoading(false);
        return;
      }
      
      // Creëer tijdsbereik filter op basis van periode
      let dateRange: DateRange | undefined = undefined;
      
      if (period === 'month') {
        const oneMonthAgo = getStartOfMonth(new Date());
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        dateRange = {
          startDate: oneMonthAgo,
          endDate: new Date()
        };
      } else if (period === 'year') {
        const oneYearAgo = getStartOfYear(new Date());
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        dateRange = {
          startDate: oneYearAgo,
          endDate: new Date()
        };
      }
      
      // Maak kolomconfiguratie voor betere weergave
      const columnConfig: ColumnConfig[] = [
        { key: 'log_date', header: 'Datum', format: 'date' },
        { key: 'client', header: 'Cliënt', transform: (value: { full_name?: string } | null | undefined) => value?.full_name || '' },
        { key: 'incident_type', header: 'Type Incident', transform: (value: { name?: string } | null | undefined) => value?.name || '' },
        { key: 'incident_type', header: 'Categorie', transform: (value: { category?: string } | null | undefined) => value?.category || '' },
        { key: 'location', header: 'Locatie' },
        { key: 'severity', header: 'Ernst' },
        { key: 'time_of_day', header: 'Tijdstip' },
        { key: 'triggered_by', header: 'Trigger' },
        { key: 'intervention_successful', header: 'Interventie Succesvol', format: 'boolean' },
        { key: 'notes', header: 'Notities', format: 'text', formatOptions: { maxLength: 100 } }
      ];
      
      // Bepaal bestandsnaam op basis van periode
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mic-incidenten-${period}-${timestamp}`;
      
      // Excel-specifieke opties voor betere styling
      const excelOptions = {
        title: 'MIC Incidenten Rapport',
        customColors: {
          headerBackground: darkMode ? '334BA5' : '2B5A9B',
          titleBackground: darkMode ? '2A407E' : 'EFF3FA',
        },
        includeStatistics: true
      };
      
      // Gebruik de geïntegreerde export functie
      await exportData({
        data,
        format,
        filename,
        dateRange,
        columnConfig,
        excelOptions,
        includeMetadata: true
      });
      
    } catch (err: unknown) {
      console.error('Error exporting data:', err);
      let errorMessage = 'Kon data niet exporteren.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon data niet exporteren: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Database backup functie
  const createBackup = async () => {
    setLoading(true);
    
    try {
      // Haal de structuur en data van alle relevante tabellen op
      const tables = ['incident_logs', 'clients', 'incident_types', 'daily_totals', 'profiles'];
      const backup: Record<string, unknown[]> = {};
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
        if (error) throw error;
        if (data) {
          backup[table] = data;
        } else {
          backup[table] = [];
        }
      }
      
      // Gebruik de quick export functie voor JSON met metadata
      quickExportToJson(backup, `mic-database-backup-${new Date().toISOString().split('T')[0]}`, true);
      
    } catch (err: unknown) {
      console.error('Error creating backup:', err);
      let errorMessage = 'Kon backup niet maken.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon backup niet maken: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ui" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ui">Uiterlijk</TabsTrigger>
          <TabsTrigger value="notifications">Notificaties</TabsTrigger>
          <TabsTrigger value="system">Systeem</TabsTrigger>
          <TabsTrigger value="data">Gegevens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <CardTitle>Uiterlijk Instellingen</CardTitle>
              <CardDescription>Pas het uiterlijk van de applicatie aan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Donkere modus</Label>
                  <p className="text-sm text-muted-foreground">
                    Schakel tussen licht en donker thema
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent kleur</Label>
                <div className="flex flex-wrap gap-2">
                  {['blue', 'purple', 'green', 'orange', 'red'].map(color => (
                    <button
                      key={color}
                      onClick={() => changeAccentColor(color)}
                      className={`w-8 h-8 rounded-full ${
                        accentColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ 
                        backgroundColor: 
                          color === 'blue' ? '#3b82f6' :
                          color === 'purple' ? '#8b5cf6' :
                          color === 'green' ? '#22c55e' :
                          color === 'orange' ? '#f97316' :
                          '#ef4444'
                      }}
                      title={`${color} accent`}
                      aria-label={`Set ${color} as accent color`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificatie Instellingen</CardTitle>
              <CardDescription>Configureer hoe je geïnformeerd wilt worden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">E-mail notificaties</Label>
                  <p className="text-sm text-muted-foreground">
                    Ontvang belangrijke notificaties via e-mail
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="critical-alerts">Kritieke meldingen</Label>
                  <p className="text-sm text-muted-foreground">
                    Ontvang direct melding van kritieke incidenten
                  </p>
                </div>
                <Switch
                  id="critical-alerts"
                  checked={criticalAlerts}
                  onCheckedChange={setCriticalAlerts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="summary-reports">Wekelijkse samenvattingen</Label>
                  <p className="text-sm text-muted-foreground">
                    Ontvang wekelijks een overzicht van alle incidenten
                  </p>
                </div>
                <Switch
                  id="summary-reports"
                  checked={summaryReports}
                  onCheckedChange={setSummaryReports}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Systeem Instellingen</CardTitle>
              <CardDescription>Beheer sessies en systeemvoorkeuren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="session-timeout">Sessie timeout (minuten)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  min="5"
                  max="120"
                />
                <p className="text-sm text-muted-foreground">
                  Tijd in minuten voordat inactieve gebruikers worden uitgelogd
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="backup-frequency">Backup frequentie</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Selecteer frequentie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Dagelijks</SelectItem>
                    <SelectItem value="weekly">Wekelijks</SelectItem>
                    <SelectItem value="monthly">Maandelijks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Hoe vaak automatische backups worden gemaakt
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Gegevensbeheer</CardTitle>
              <CardDescription>Export en beheer uw gegevens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-base font-medium">Data Export</h3>
                <p className="text-sm text-muted-foreground">
                  Download een kopie van incidentregistraties in verschillende formaten
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Exporteer als JSON</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Compleet gestructureerd gegevensformaat voor integratie met andere systemen
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('json', 'all')}
                          disabled={loading}
                        >
                          Alle data
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('json', 'year')}
                          disabled={loading}
                        >
                          Afgelopen jaar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('json', 'month')}
                          disabled={loading}
                        >
                          Afgelopen maand
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Exporteer als CSV</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Compatibel met Excel en andere spreadsheet programma's
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('csv', 'all')}
                          disabled={loading}
                        >
                          Alle data
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('csv', 'year')}
                          disabled={loading}
                        >
                          Afgelopen jaar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('csv', 'month')}
                          disabled={loading}
                        >
                          Afgelopen maand
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Exporteer als Excel</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Professioneel gestylde spreadsheet met opmaak en samenvattingen
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('excel', 'all')}
                          disabled={loading}
                        >
                          Alle data
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('excel', 'year')}
                          disabled={loading}
                        >
                          Afgelopen jaar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDataExport('excel', 'month')}
                          disabled={loading}
                        >
                          Afgelopen maand
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin h-5 w-5 border-t-2 border-primary rounded-full mr-2"></div>
                    <span className="text-sm">Bezig met verwerken...</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-base font-medium">Database Backup</h3>
                <p className="text-sm text-muted-foreground">
                  Maak een volledige backup van de database voor herstel- en migratiedoeleinden
                </p>
                <div className="p-4 border rounded-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-medium">Complete database backup</h4>
                      <p className="text-xs text-muted-foreground">
                        Bevat alle tabellen, relaties en gegevens
                      </p>
                    </div>
                    <Button 
                      variant="default"
                      onClick={createBackup}
                      disabled={loading}
                      className="whitespace-nowrap"
                    >
                      {loading ? 'Bezig met backup...' : 'Backup nu maken'}
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Opmerking:</strong> Backup bestanden bevatten gevoelige informatie en moeten veilig worden bewaard. Voor volledige server backups, neem contact op met de systeembeheerder.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Annuleren
        </Button>
        <Button 
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? 'Opslaan...' : 'Instellingen opslaan'}
        </Button>
        
        {saveSuccess && (
          <div className="text-sm text-green-600 flex items-center">
            ✓ Instellingen opgeslagen
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab; 