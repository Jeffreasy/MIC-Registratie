import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartMonthlySummary } from '@/lib/types';

interface MonthlyChartProps {
  monthlyData: ChartMonthlySummary[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ monthlyData }) => {
  // Format month for display
  const formatMonth = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
  };

  // Prepare data for chart
  const chartData = monthlyData.map(item => ({
    name: formatMonth(item.month),
    aantal: item.total_count
  }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Maandelijks overzicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 300 }}>
          {monthlyData.length > 0 ? (
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
                <Bar dataKey="aantal" fill="#8884d8" name="Aantal incidenten" />
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

export default MonthlyChart; 