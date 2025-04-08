import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { format } from "date-fns";

interface StatisticsTabProps {
  setError: (error: string | null) => void;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ setError }) => {
  // Standaard periode is laatste 30 dagen
  const defaultStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalsData, setTotalsData] = useState<{total: number, clients: number, types: number}>({
    total: 0,
    clients: 0,
    types: 0
  });
  const [detailedIncidents, setDetailedIncidents] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch data on date range change
  useEffect(() => {
    fetchStatisticsData();
  }, [startDate, endDate]);

  const fetchStatisticsData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      // Fetch daily totals data
      const { data: dailyTotals, error: dailyError } = await supabase
        .from('daily_totals')
        .select('*')
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date');
        
      if (dailyError) throw dailyError;
      
      // Process daily data for charts
      const processedDailyData = processDateData(dailyTotals || []);
      setDailyData(processedDailyData);
      
      // Fetch categories and group by category
      const { data: categoryTotals, error: categoryError } = await supabase
        .from('daily_totals')
        .select('category, total_count')
        .gte('log_date', startDate)
        .lte('log_date', endDate);
        
      if (categoryError) throw categoryError;
      
      // Process category data for pie chart - manual grouping
      const categoryMap: Record<string, number> = {};
      (categoryTotals || []).forEach((item: any) => {
        const categoryName = item.category || 'Onbekend';
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = 0;
        }
        categoryMap[categoryName] += item.total_count;
      });
      
      const processedCategoryData = Object.entries(categoryMap).map(([category, totalCount]) => ({
        name: category,
        value: totalCount,
        color: getCategoryColor(category)
      }));
      
      setCategoryData(processedCategoryData);

      // Haal gedetailleerde incidentgegevens op
      const { data: incidents, error: incidentsError } = await supabase
        .from('incident_logs')
        .select(`
          id,
          log_date,
          count,
          location,
          client_id,
          incident_type_id,
          incident_type:incident_type_id(id, name, category),
          client:client_id(id, full_name)
        `)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });
        
      if (incidentsError) throw incidentsError;
      
      // Controleer of er ontbrekende client relaties zijn
      if (incidents && incidents.length > 0) {
        const missingClientIds = incidents
          .filter(inc => !inc.client)
          .map(inc => inc.client_id)
          .filter(id => id); // Filter out null/undefined
          
        if (missingClientIds.length > 0) {
          // Haal ontbrekende clients direct op
          const { data: missingClients } = await supabase
            .from('clients')
            .select('id, full_name')
            .in('id', missingClientIds);
            
          // Handmatig client informatie toevoegen aan incidents
          const enrichedIncidents = incidents.map(incident => {
            if (!incident.client && incident.client_id) {
              const matchingClient = missingClients?.find(c => c.id === incident.client_id);
              if (matchingClient) {
                return {
                  ...incident,
                  client: matchingClient
                };
              }
            }
            return incident;
          });
          
          setDetailedIncidents(enrichedIncidents);
        } else {
          setDetailedIncidents(incidents);
        }
      } else {
        setDetailedIncidents([]);
      }

      // Calculate totals manually
      let totalIncidents = 0;
      const clientIds = new Set<string>();
      const typeIds = new Set<string>();
      
      (dailyTotals || []).forEach((item: any) => {
        totalIncidents += item.total_count;
        if (item.client_id) clientIds.add(item.client_id);
        if (item.incident_type_id) typeIds.add(item.incident_type_id);
      });
      
      setTotalsData({
        total: totalIncidents,
        clients: clientIds.size,
        types: typeIds.size
      });
      
    } catch (err: any) {
      console.error('Error fetching statistics data:', err);
      setError(`Kon statistieken niet laden: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Process date data for charts
  const processDateData = (data: any[]) => {
    // Group by date
    const dateGroups: {[key: string]: number} = {};
    
    data.forEach((item: any) => {
      const date = item.log_date;
      if (!dateGroups[date]) {
        dateGroups[date] = 0;
      }
      dateGroups[date] += item.total_count;
    });
    
    // Convert to array for chart
    return Object.entries(dateGroups)
      .map(([date, count]) => ({
        date: formatDate(date),
        value: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    // Standaard format zonder locale
    return format(date, 'dd/MM');
  };
  
  // Get color based on category
  const getCategoryColor = (category: string | null): string => {
    switch(category) {
      case 'fysiek': return '#ef4444';
      case 'verbaal': return '#3b82f6';
      case 'emotioneel': return '#eab308';
      case 'sociaal': return '#22c55e';
      default: return '#a3a3a3';
    }
  };

  // Helper functie om bekend client_id te herkennen
  const getClientNameFromId = (clientId: string | null): string => {
    if (!clientId) return 'Onbekend';
    
    // Bekende client IDs
    if (clientId === '62713cf6-1b6e-43a6-9dec-2ff8c25b2b3e') {
      return 'A. Aberrazek';
    }
    
    // Verkort ID weergeven als we de naam niet kennen
    return `Client ID: ${clientId.substring(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm whitespace-nowrap">Van:</label>
          <Input
            type="date"
            id="start-date"
            className="max-w-[200px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm whitespace-nowrap">Tot:</label>
          <Input
            type="date"
            id="end-date"
            className="max-w-[200px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Totaal incidenten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : totalsData.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Unieke cliënten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : totalsData.clients}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Incidenttypes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : totalsData.types}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Dagelijks</TabsTrigger>
          <TabsTrigger value="category">Per categorie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dagelijks overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ height: 400 }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Gegevens laden...</p>
                  </div>
                ) : dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} incidenten`, 'Aantal']}
                        labelFormatter={(label) => `Datum: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Aantal incidenten" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Geen gegevens beschikbaar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verdeling per categorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ height: 400 }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Gegevens laden...</p>
                  </div>
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} incidenten`, 'Aantal']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Geen gegevens beschikbaar</p>
                  </div>
                )}
              </div>
              
              {/* Lijst met incidenten per categorie */}
              {categoryData.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Incidenten per categorie</h3>
                  <div className="space-y-4">
                    {categoryData.map((category) => (
                      <div key={category.name} className="border rounded-md overflow-hidden">
                        <div 
                          className="p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                          style={{ backgroundColor: `${category.color}20` }}
                          onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{category.value} incidenten</span>
                            <svg 
                              className={`h-5 w-5 transform transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {expandedCategory === category.name && (
                          <div className="p-3 border-t">
                            {detailedIncidents.filter(
                              incident => incident.incident_type?.category === category.name
                            ).length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">Geen incidenten gevonden in deze categorie.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 px-1">Datum</th>
                                      <th className="text-left py-2 px-1">Type</th>
                                      <th className="text-left py-2 px-1">Cliënt</th>
                                      <th className="text-left py-2 px-1">Locatie</th>
                                      <th className="text-right py-2 px-1">Aantal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detailedIncidents
                                      .filter(incident => incident.incident_type?.category === category.name)
                                      .map(incident => (
                                        <tr key={incident.id} className="border-b border-muted last:border-b-0">
                                          <td className="py-2 px-1">{formatDate(incident.log_date)}</td>
                                          <td className="py-2 px-1">{incident.incident_type?.name || 'Onbekend'}</td>
                                          <td className="py-2 px-1">
                                            {incident.client?.full_name || getClientNameFromId(incident.client_id)}
                                          </td>
                                          <td className="py-2 px-1">{incident.location || '-'}</td>
                                          <td className="py-2 px-1 text-right">{incident.count}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatisticsTab; 