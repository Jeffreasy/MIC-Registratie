import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { IncidentType } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Check, X } from 'lucide-react';

interface IncidentsTabProps {
  incidentTypes: IncidentType[];
  setIncidentTypes: React.Dispatch<React.SetStateAction<IncidentType[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const IncidentsTab: React.FC<IncidentsTabProps> = ({ 
  incidentTypes, 
  setIncidentTypes, 
  setError 
}) => {
  const [editingIncidentType, setEditingIncidentType] = useState<number | null>(null);
  const [newIncidentName, setNewIncidentName] = useState('');
  const [newIncidentCategory, setNewIncidentCategory] = useState<'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal'>('fysiek');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState(3);
  const [newIncidentRequiresNotification, setNewIncidentRequiresNotification] = useState(false);

  // Create new incident type
  const handleCreateIncidentType = async () => {
    if (!newIncidentName) return;
    
    try {
      const { data, error } = await supabase
        .from('incident_types')
        .insert([
          { 
            name: newIncidentName, 
            category: newIncidentCategory,
            severity_level: newIncidentSeverity,
            requires_notification: newIncidentRequiresNotification,
            is_active: true
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Add to local state
      if (data && data.length > 0) {
        setIncidentTypes([...incidentTypes, data[0]]);
      }
      
      // Reset form
      setNewIncidentName('');
      setNewIncidentCategory('fysiek');
      setNewIncidentSeverity(3);
      setNewIncidentRequiresNotification(false);
    } catch (err: unknown) {
      console.error('Error creating incident type:', err);
      let errorMessage = 'Kon incident type niet aanmaken.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon incident type niet aanmaken: ' + errorMessage);
    }
  };
  
  // Update incident type
  const handleUpdateIncidentType = async (
    id: number, 
    name: string, 
    category: 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null, 
    severity_level: number,
    requires_notification: boolean,
    is_active: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('incident_types')
        .update({ 
          name, 
          category, 
          severity_level,
          requires_notification,
          is_active
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setIncidentTypes(incidentTypes.map(t => 
        t.id === id ? { 
          ...t, 
          name, 
          category, 
          severity_level,
          requires_notification,
          is_active
        } : t
      ));
      
      setEditingIncidentType(null);
    } catch (err: unknown) {
      console.error('Error updating incident type:', err);
      let errorMessage = 'Kon incident type niet bijwerken.';
      if (err instanceof Error) { errorMessage = err.message; }
      else if (typeof err === 'string') { errorMessage = err; }
      setError('Kon incident type niet bijwerken: ' + errorMessage);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Nieuw Incident Type Toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="incident-name">Naam</Label>
              <Input
                id="incident-name"
                value={newIncidentName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIncidentName(e.target.value)}
                placeholder="Naam van incident type"
              />
            </div>
            <div>
              <Label htmlFor="incident-category">Categorie</Label>
              <Select
                value={newIncidentCategory}
                onValueChange={(value: string) => setNewIncidentCategory(value as 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal')}
              >
                <SelectTrigger id="incident-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fysiek">Fysiek</SelectItem>
                  <SelectItem value="verbaal">Verbaal</SelectItem>
                  <SelectItem value="emotioneel">Emotioneel</SelectItem>
                  <SelectItem value="sociaal">Sociaal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="incident-severity">Ernst niveau (1-5)</Label>
              <Input
                id="incident-severity"
                type="number"
                min="1"
                max="5"
                value={newIncidentSeverity}
                onChange={(e) => setNewIncidentSeverity(parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="requires-notification" 
                checked={newIncidentRequiresNotification}
                onChange={(e) => setNewIncidentRequiresNotification(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <Label htmlFor="requires-notification">Vereist melding</Label>
            </div>
          </div>
          <Button
            onClick={handleCreateIncidentType}
            disabled={!newIncidentName}
          >
            <Plus className="h-4 w-4 mr-1" />
            Toevoegen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incident Types</CardTitle>
          <CardDescription>
            {incidentTypes.length} incident types in totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Naam</th>
                  <th className="text-left py-2">Categorie</th>
                  <th className="text-left py-2">Ernst</th>
                  <th className="text-left py-2">Melding</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Acties</th>
                </tr>
              </thead>
              <tbody>
                {incidentTypes.map((type) => (
                  <tr key={type.id} className="border-b">
                    <td className="py-2">
                      {editingIncidentType === type.id ? (
                        <Input
                          value={incidentTypes.find(t => t.id === type.id)?.name || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setIncidentTypes(incidentTypes.map(t => 
                              t.id === type.id ? { ...t, name: e.target.value } : t
                            ));
                          }}
                        />
                      ) : (
                        type.name
                      )}
                    </td>
                    <td className="py-2">
                      {editingIncidentType === type.id ? (
                        <Select
                          value={incidentTypes.find(t => t.id === type.id)?.category || 'fysiek'}
                          onValueChange={(value: string) => {
                            setIncidentTypes(incidentTypes.map(t => 
                              t.id === type.id ? { ...t, category: value as 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null } : t
                            ));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fysiek">Fysiek</SelectItem>
                            <SelectItem value="verbaal">Verbaal</SelectItem>
                            <SelectItem value="emotioneel">Emotioneel</SelectItem>
                            <SelectItem value="sociaal">Sociaal</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        type.category || '-'
                      )}
                    </td>
                    <td className="py-2">
                      {editingIncidentType === type.id ? (
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={incidentTypes.find(t => t.id === type.id)?.severity_level || 3}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setIncidentTypes(incidentTypes.map(t => 
                              t.id === type.id ? { ...t, severity_level: parseInt(e.target.value) || 3 } : t
                            ));
                          }}
                        />
                      ) : (
                        type.severity_level || '-'
                      )}
                    </td>
                    <td className="py-2">
                      {editingIncidentType === type.id ? (
                        <input
                          type="checkbox"
                          checked={incidentTypes.find(t => t.id === type.id)?.requires_notification || false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setIncidentTypes(incidentTypes.map(t => 
                              t.id === type.id ? { ...t, requires_notification: e.target.checked } : t
                            ));
                          }}
                        />
                      ) : (
                        type.requires_notification ? 'Ja' : 'Nee'
                      )}
                    </td>
                    <td className="py-2">
                      {editingIncidentType === type.id ? (
                        <select
                          value={incidentTypes.find(t => t.id === type.id)?.is_active ? 'active' : 'inactive'}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setIncidentTypes(incidentTypes.map(t => 
                              t.id === type.id ? { ...t, is_active: e.target.value === 'active' } : t
                            ));
                          }}
                          className="px-2 py-1 rounded border"
                        >
                          <option value="active">Actief</option>
                          <option value="inactive">Inactief</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${type.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'}`}>
                          {type.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editingIncidentType === type.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = incidentTypes.find(t => t.id === type.id);
                              if (current) {
                                handleUpdateIncidentType(
                                  type.id, 
                                  current.name, 
                                  current.category as 'fysiek' | 'verbaal' | 'emotioneel' | 'sociaal' | null,
                                  current.severity_level || 3,
                                  current.requires_notification || false,
                                  current.is_active || false
                                );
                              }
                            }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIncidentType(null)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIncidentType(type.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentsTab; 