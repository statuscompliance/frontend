"use client"

import React, { useState } from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { enGB } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function DatePickerWithPresets({ date, setDate }) {
  const [selectedPreset, setSelectedPreset] = useState("")

  const presets = [
    {
      name: "Last week",
      date: addDays(new Date(), -7),
    },
    {
      name: "This week",
      date: new Date(),
    },
    {
      name: "Next week",
      date: addDays(new Date(), 7),
    },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: enGB }) : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        <Select
          onValueChange={(value) => {
            setSelectedPreset(value)
            const preset = presets.find((preset) => preset.name === value)
            if (preset) {
              setDate(preset.date)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent position="popper">
            {presets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="rounded-md border"></div>
        <Calendar mode="single" selected={date} onSelect={(newDate) => newDate && setDate(newDate)} locale={enGB} />
      </PopoverContent>
    </Popover>
  );
}

export { DatePickerWithPresets }
