import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSelectorProps {
  locations: string[];
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
  disabled = false
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="location-select" className="block text-sm font-medium mb-1">
        Locatie (optioneel)
      </label>
      <Select
        value={selectedLocation || 'none'}
        onValueChange={onLocationChange}
        disabled={disabled}
      >
        <SelectTrigger id="location-select" className="w-full">
          <SelectValue placeholder="Kies een locatie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Geen locatie</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector; 