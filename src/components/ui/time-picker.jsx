import React, { forwardRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const CustomTimePicker = forwardRef(({ value, onChange }, ref) => {
  const [hours, minutes] = value.split(':').map(Number);

  const handleHourChange = (newHour) => {
    onChange(`${newHour.padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute) => {
    onChange(`${hours.toString().padStart(2, '0')}:${newMinute.padStart(2, '0')}`);
  };

  return (
    <div className="space-y-2" ref={ref}>
      <div className="flex space-x-2">
        <Select value={hours.toString()} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label className="flex items-center">:</Label>
        <Select value={minutes.toString()} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Minutos" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i * 5} value={(i * 5).toString()}>
                {(i * 5).toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

CustomTimePicker.displayName = 'CustomTimePicker'; // This is required for debugging purposes.
