import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { IncidentLogWithRelations } from '@/lib/types';

interface IncidentTypeDistributionProps {
  logs: IncidentLogWithRelations[];
}

const IncidentTypeDistribution: React.FC<IncidentTypeDistributionProps> = ({ logs }) => {
  // Calculate distribution by incident type
  const getIncidentTypeDistribution = () => {
    const typeCounts: { [key: string]: { count: number, category: string | null, color: string | null } } = {};
    
    logs.forEach(log => {
      const typeName = log.incident_type.name;
      if (!typeCounts[typeName]) {
        typeCounts[typeName] = {
          count: 0,
          category: log.incident_type.category,
          color: log.incident_type.color_code
        };
      }
      typeCounts[typeName].count += log.count;
    });
    
    return Object.entries(typeCounts)
      .map(([name, data]) => ({
        name,
        value: data.count,
        category: data.category,
        color: data.color || getCategoryColor(data.category)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };
  
  // Get color based on category if no specific color is set
  const getCategoryColor = (category: string | null): string => {
    switch(category) {
      case 'fysiek': return '#ef4444';
      case 'verbaal': return '#3b82f6';
      case 'emotioneel': return '#eab308';
      case 'sociaal': return '#22c55e';
      default: return '#a3a3a3';
    }
  };
  
  const data = getIncidentTypeDistribution();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Verdeling per incidenttype</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 300 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} incidenten`, 'Aantal']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Geen gegevens beschikbaar
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTypeDistribution; 