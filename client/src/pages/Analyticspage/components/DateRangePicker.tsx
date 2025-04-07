import React from 'react';
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="flex items-center gap-1">
        <label htmlFor="start-date" className="text-sm whitespace-nowrap">Van:</label>
        <Input
          type="date"
          id="start-date"
          className="max-w-[200px]"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1">
        <label htmlFor="end-date" className="text-sm whitespace-nowrap">Tot:</label>
        <Input
          type="date"
          id="end-date"
          className="max-w-[200px]"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default DateRangePicker; 