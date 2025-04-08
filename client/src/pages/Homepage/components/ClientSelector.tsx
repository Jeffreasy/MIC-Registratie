import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client } from '@/lib/types';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string;
  onClientChange: (value: string) => void;
  disabled?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClientId,
  onClientChange,
  disabled = false
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="client-select" className="block text-sm font-medium mb-1">
        Selecteer cliënt
      </label>
      <Select
        value={selectedClientId}
        onValueChange={onClientChange}
        disabled={disabled}
      >
        <SelectTrigger id="client-select" className="w-full">
          <SelectValue placeholder="Kies een cliënt" />
        </SelectTrigger>
        <SelectContent>
          {clients.length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              Geen cliënten gevonden
            </div>
          ) : (
            clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.full_name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelector; 