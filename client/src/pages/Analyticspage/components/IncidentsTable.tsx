import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { IncidentLogWithRelations } from '@/lib/types';
import { nl } from 'date-fns/locale';

interface IncidentsTableProps {
  logs: IncidentLogWithRelations[];
}

const IncidentsTable: React.FC<IncidentsTableProps> = ({ logs }) => {
  // Format date consistently
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Geregistreerde incidenten</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Cliënt</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Ernst</TableHead>
                <TableHead>Locatie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.log_date)}</TableCell>
                    <TableCell>{log.client?.full_name}</TableCell>
                    <TableCell>
                      <Badge 
                        style={{
                          backgroundColor: log.incident_type.color_code || '#888',
                          color: getBadgeTextColor(log.incident_type.color_code)
                        }}
                      >
                        {log.incident_type.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.count}</TableCell>
                    <TableCell>{log.severity}</TableCell>
                    <TableCell>{log.location}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Geen incidenten gevonden in de geselecteerde periode
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to determine text color based on background color brightness
const getBadgeTextColor = (bgColor: string | null): string => {
  if (!bgColor) return 'white';
  
  // Remove the # if it exists
  const hex = bgColor.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate brightness (perceived brightness formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark backgrounds, black for light backgrounds
  return brightness > 155 ? 'black' : 'white';
};

export default IncidentsTable; 