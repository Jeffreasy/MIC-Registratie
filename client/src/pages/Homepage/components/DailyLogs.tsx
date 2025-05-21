import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, MapPin, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { IncidentLogWithRelations } from '@/lib/types';

interface DailyLogsProps {
  dailyLogs: IncidentLogWithRelations[];
  deletingLogId: number | null;
  editingLog: { id: number, count: number } | null;
  onDeleteLog: (id: number) => void;
  onUpdateLogCount: (id: number, count: number) => void;
  formatTime: (time: string | null) => string;
  isLoading?: boolean;
}

const DailyLogs: React.FC<DailyLogsProps> = ({
  dailyLogs,
  deletingLogId,
  editingLog,
  onDeleteLog,
  onUpdateLogCount,
  formatTime,
  isLoading
}) => {
  const [countEdits, setCountEdits] = useState<{[key: number]: number}>({});
  
  // Functie om lokaal de bewerkte waarde bij te houden
  const handleCountChange = (id: number, count: number) => {
    setCountEdits({ ...countEdits, [id]: count });
  };

  // Functie om bewerking te bewaren
  const handleSaveCount = (id: number) => {
    const newCount = countEdits[id];
    if (newCount && newCount >= 1) {
      onUpdateLogCount(id, newCount);
      // Reset de lokale edit state
      const newEdits = { ...countEdits };
      delete newEdits[id];
      setCountEdits(newEdits);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Registraties vandaag</CardTitle>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && dailyLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Laden...
          </div>
        ) : dailyLogs.length === 0 && !isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            Geen registraties gevonden voor vandaag.
          </div>
        ) : (
          <div className="space-y-2">
            {dailyLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full mr-2" 
                      style={{ 
                        backgroundColor: log.incident_type.color_code || '#888'
                      }} 
                    />
                    <span className="font-medium">{log.incident_type.name}</span>
                    {log.incident_type.requires_notification && (
                      <AlertTriangle className="h-3 w-3 ml-1 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {log.client?.full_name || 'Onbekende cliënt'}
                    {log.location && (
                      <span className="inline-flex items-center ml-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        {log.location}
                      </span>
                    )}
                    {log.time_of_day && (
                      <span className="inline-flex items-center ml-3">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(log.time_of_day)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {editingLog && editingLog.id === log.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        className="w-12 h-7 text-center border border-input rounded"
                        value={countEdits[log.id] !== undefined ? countEdits[log.id] : log.count}
                        onChange={(e) => handleCountChange(log.id, parseInt(e.target.value) || 1)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2" 
                        onClick={() => handleSaveCount(log.id)}
                      >
                        OK
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-7 flex items-center justify-center font-medium bg-muted rounded">
                        {log.count}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleCountChange(log.id, log.count)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Bewerk aantal</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteLog(log.id)}
                        disabled={!!deletingLogId}
                      >
                        {deletingLogId === log.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">Verwijder</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyLogs; 