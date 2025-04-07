// @ts-nocheck

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import useAnalyticsData from './hooks/useAnalyticsData';
import DateRangePicker from './components/DateRangePicker';
import MonthlyChart from './components/MonthlyChart';
import DailyChart from './components/DailyChart';
import IncidentTypeDistribution from './components/IncidentTypeDistribution';
import IncidentsTable from './components/IncidentsTable';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    monthlyData,
    dailyTotals,
    logs,
    loading,
    error
  } = useAnalyticsData(user?.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Analyse</h1>
      
      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Gegevens laden...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <Tabs defaultValue="charts" className="w-full">
          <TabsList>
            <TabsTrigger value="charts">Grafieken</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyChart monthlyData={monthlyData} />
              <DailyChart dailyTotals={dailyTotals} />
            </div>
            <IncidentTypeDistribution logs={logs} />
          </TabsContent>
          
          <TabsContent value="details">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <IncidentsTable logs={logs} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AnalyticsPage; 