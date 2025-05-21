import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DailyTotal, IncidentLogWithRelations, ChartMonthlySummary } from '@/lib/types';

export const useAnalyticsData = (userId: string | undefined) => {
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
  
  const [monthlyData, setMonthlyData] = useState<ChartMonthlySummary[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [logs, setLogs] = useState<IncidentLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Haal logs op met relatiegegevens
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
          .eq('user_id', userId)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: false });
          
        if (logsError) throw logsError;
        setLogs(logsData as unknown as IncidentLogWithRelations[] || []);

        // 2. Haal maandelijkse samenvatting op uit de nieuwe view voor de grafiek
        const { data: newMonthlyData, error: monthlyError } = await supabase
          .from('monthly_incident_totals_for_chart') // Gebruik de nieuwe view
          .select('month, total_count') // Selecteer alleen de benodigde kolommen
          .eq('user_id', userId)
          .gte('month', startDate.substring(0, 7) + '-01') 
          .lte('month', endDate.substring(0, 7) + '-01')
          .order('month');

        // Console logs om de nieuwe data te inspecteren
        console.log('Querying monthly_incident_totals_for_chart with:', {
          userId,
          startFilter: startDate.substring(0, 7) + '-01',
          endFilter: endDate.substring(0, 7) + '-01'
        });
        console.log('Monthly Error from Supabase (new view):', monthlyError);
        console.log('Monthly Data from Supabase (new view):', newMonthlyData);

        if (monthlyError) throw monthlyError;
        setMonthlyData(newMonthlyData || []); // Zet de data voor de grafiek

        // 3. Haal dagelijkse totalen op via materialized view
        const { data: _dailyTotals, error: dailyError } = await supabase
          .from('daily_totals')
          .select('*')
          .eq('user_id', userId)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date');

        if (dailyError) throw dailyError;
        setDailyTotals(_dailyTotals || []);
        
      } catch (err: unknown) {
        let errorMessage = 'Er is een onbekende fout opgetreden bij het ophalen van gegevens.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.error('Error fetching analytics data:', err);
        setError('Kon gegevens niet laden: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, startDate, endDate]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    monthlyData,
    dailyTotals,
    logs,
    loading,
    error
  };
};

export default useAnalyticsData; 