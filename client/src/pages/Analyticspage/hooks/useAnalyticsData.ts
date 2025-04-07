import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MonthlySummary, DailyTotal, IncidentLogWithRelations } from '@/lib/types';

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
  
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
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

        // 2. Haal maandelijkse samenvatting op uit de speciale view
        const { data: _monthlyData, error: monthlyError } = await supabase
          .from('monthly_summary')
          .select('*')
          .eq('user_id', userId)
          .gte('month', startDate.substring(0, 7) + '-01') // Format to YYYY-MM-DD for timestamp compatibility
          .lte('month', endDate.substring(0, 7) + '-01')
          .order('month');

        if (monthlyError) throw monthlyError;
        setMonthlyData(_monthlyData || []);

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
        
      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError('Kon gegevens niet laden: ' + err.message);
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