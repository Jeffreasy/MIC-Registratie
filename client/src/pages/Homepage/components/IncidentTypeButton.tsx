import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { IncidentType } from '@/lib/types';

interface IncidentTypeButtonProps {
  type: Partial<IncidentType>;
  isLoading: boolean;
  isSuccess: boolean;
  loggingIncidentId: number | null;
  onClick: () => void;
  color: string;
}

const IncidentTypeButton: React.FC<IncidentTypeButtonProps> = ({
  type,
  isLoading,
  isSuccess,
  loggingIncidentId,
  onClick,
  color
}) => {
  const originalType = type as IncidentType;
  
  return (
    <Button
      variant={isLoading ? "secondary" : "default"}
      size="sm"
      onClick={onClick}
      disabled={isLoading || !!loggingIncidentId || !originalType}
      className={`transition duration-150 ease-in-out w-full py-6 text-sm h-auto whitespace-normal flex flex-col items-center justify-center ${isSuccess ? 'bg-green-500 hover:bg-green-600 text-white' : ''} ${isLoading ? 'cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: !isLoading && !isSuccess ? color : undefined,
        color: !isLoading && !isSuccess && color !== '#a3a3a3' ? '#fff' : undefined,
        borderColor: color,
        minHeight: '60px'
      }}
    >
      <span className="line-clamp-2">{isLoading ? 'Bezig...' : isSuccess ? 'Gelukt! ✔' : type.name}</span>
      {originalType?.requires_notification && (
        <AlertTriangle className="h-3 w-3 text-white mt-1" />
      )}
    </Button>
  );
};

export default IncidentTypeButton; 