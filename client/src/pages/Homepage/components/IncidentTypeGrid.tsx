import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentType } from '@/lib/types';
import IncidentTypeButton from './IncidentTypeButton';

interface IncidentTypeGridProps {
  incidentTypes: IncidentType[];
  loggingIncidentId: number | null;
  logSuccessId: number | null;
  onIncidentLog: (incidentTypeId: number) => void;
}

const IncidentTypeGrid: React.FC<IncidentTypeGridProps> = ({
  incidentTypes,
  loggingIncidentId,
  logSuccessId,
  onIncidentLog
}) => {
  // Groepeer incident types per categorie voor weergave
  const groupedIncidentTypes: { [key: string]: IncidentType[] } = {};
  incidentTypes.forEach(type => {
    const category = type.category || 'overig';
    if (!groupedIncidentTypes[category]) {
      groupedIncidentTypes[category] = [];
    }
    groupedIncidentTypes[category].push(type);
  });

  // Sortering van categorieën (vaste volgorde)
  const categoryOrder = ['fysiek', 'verbaal', 'emotioneel', 'sociaal', 'overig'];
  const sortedCategories = Object.keys(groupedIncidentTypes).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );
  
  // Get categoryName for display
  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'fysiek': return 'Fysiek';
      case 'verbaal': return 'Verbaal';
      case 'emotioneel': return 'Emotioneel';
      case 'sociaal': return 'Sociaal';
      case 'overig': 
      default: return 'Overig';
    }
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'fysiek': return '#ef4444'; // Rood
      case 'verbaal': return '#3b82f6'; // Blauw
      case 'emotioneel': return '#eab308'; // Geel
      case 'sociaal': return '#22c55e'; // Groen
      default: return '#a3a3a3'; // Grijs
    }
  };
  
  return (
    <div className="space-y-6">
      {sortedCategories.map(category => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{getCategoryName(category)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {groupedIncidentTypes[category].map(type => {
                const isLoading = loggingIncidentId === type.id;
                const isSuccess = logSuccessId === type.id;
                const buttonColor = type.color_code || getCategoryColor(category);
                
                return (
                  <IncidentTypeButton 
                    key={type.id}
                    type={type}
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                    loggingIncidentId={loggingIncidentId}
                    onClick={() => onIncidentLog(type.id)}
                    color={buttonColor}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IncidentTypeGrid; 