import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyTotal } from '@/lib/types';

interface DailyChartProps {
  dailyTotals: DailyTotal[];
}

const DailyChart: React.FC<DailyChartProps> = ({ dailyTotals }) => {
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
  };

  // Prepare data for chart
  const chartData = dailyTotals.map(item => ({
    name: formatDate(item.log_date),
    aantal: item.total_count
  }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Dagelijks overzicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 300 }}>
          {dailyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aantal" fill="#82ca9d" name="Aantal incidenten" />
              </BarChart>
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

export default DailyChart; 