import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@/lib/types';
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
import { Plus, Edit2, Check, X } from 'lucide-react';

interface ClientsTabProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ clients, setClients, setError }) => {
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<string | null>(null);

  // Create new client
  const handleCreateClient = async () => {
    if (!newClientName) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          { full_name: newClientName, is_active: true }
        ])
        .select();
      
      if (error) throw error;
      
      // Add to local state
      if (data && data.length > 0) {
        setClients([...clients, data[0]]);
      }
      
      // Reset form
      setNewClientName('');
    } catch (err: any) {
      console.error('Error creating client:', err);
      setError('Kon cliënt niet aanmaken: ' + err.message);
    }
  };
  
  // Update client
  const handleUpdateClient = async (clientId: string, full_name: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ full_name, is_active })
        .eq('id', clientId);
      
      if (error) throw error;
      
      // Update local state
      setClients(clients.map(c => 
        c.id === clientId ? { ...c, full_name, is_active } : c
      ));
      
      setEditingClient(null);
    } catch (err: any) {
      console.error('Error updating client:', err);
      setError('Kon cliënt niet bijwerken: ' + err.message);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Nieuwe Cliënt Toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="client-name">Naam</Label>
              <Input
                id="client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Naam van cliënt"
              />
            </div>
            <Button
              className="mt-6"
              onClick={handleCreateClient}
              disabled={!newClientName}
            >
              <Plus className="h-4 w-4 mr-1" />
              Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cliënten</CardTitle>
          <CardDescription>
            {clients.length} cliënten in totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Naam</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Acties</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b">
                    <td className="py-2">
                      {editingClient === client.id ? (
                        <Input
                          value={clients.find(c => c.id === client.id)?.full_name || ''}
                          onChange={(e) => {
                            setClients(clients.map(c => 
                              c.id === client.id ? { ...c, full_name: e.target.value } : c
                            ));
                          }}
                        />
                      ) : (
                        client.full_name
                      )}
                    </td>
                    <td className="py-2">
                      {editingClient === client.id ? (
                        <select
                          value={clients.find(c => c.id === client.id)?.is_active ? 'active' : 'inactive'}
                          onChange={(e) => {
                            setClients(clients.map(c => 
                              c.id === client.id ? { ...c, is_active: e.target.value === 'active' } : c
                            ));
                          }}
                          className="px-2 py-1 rounded border"
                        >
                          <option value="active">Actief</option>
                          <option value="inactive">Inactief</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${client.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'}`}>
                          {client.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editingClient === client.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = clients.find(c => c.id === client.id);
                              if (current) {
                                handleUpdateClient(
                                  client.id, 
                                  current.full_name, 
                                  current.is_active
                                );
                              }
                            }}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClient(null)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingClient(client.id)}
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

export default ClientsTab; 