// @ts-nocheck

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from "@/components/ui/card";
import useHomePageData from './hooks/useHomePageData';
import ClientSelector from './components/ClientSelector';
import LocationSelector from './components/LocationSelector';
import IncidentTypeGrid from './components/IncidentTypeGrid';
import DailyLogs from './components/DailyLogs';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    clients,
    incidentTypes,
    selectedClientId,
    setSelectedClientId,
    selectedLocation,
    setSelectedLocation,
    loggingIncidentId,
    logError,
    logSuccessId,
    groupedDailyLogs,
    loadingLogs,
    deletingLogId,
    editingLog,
    locations,
    loading,
    error,
    handleIncidentLog,
    handleDeleteLog,
    handleUpdateLogCount,
    fetchTodaysLogs,
    formatTime
  } = useHomePageData(user?.id);

  if (loading) {
    return (
      <div className="p-4 container mx-auto max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-pulse">Gegevens laden...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 container mx-auto max-w-6xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 container mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Incident Registratie</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ClientSelector 
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onClientChange={setSelectedClientId}
                  disabled={!!loggingIncidentId}
                />
                
                <LocationSelector 
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  disabled={!!loggingIncidentId}
                />
              </div>
              
              {logError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p>{logError}</p>
                </div>
              )}
              
              <div className="mt-4">
                <IncidentTypeGrid 
                  incidentTypes={incidentTypes}
                  loggingIncidentId={loggingIncidentId}
                  logSuccessId={logSuccessId}
                  onIncidentLog={handleIncidentLog}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <DailyLogs 
            dailyLogs={groupedDailyLogs}
            deletingLogId={deletingLogId}
            editingLog={editingLog}
            onDeleteLog={handleDeleteLog}
            onUpdateLogCount={handleUpdateLogCount}
            onRefresh={fetchTodaysLogs}
            formatTime={formatTime}
            isLoading={loadingLogs}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage; 