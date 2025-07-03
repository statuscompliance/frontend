// src/components/ui/combobox.jsx
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * A reusable ComboBox component for selecting from a list of options with search functionality.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.options - An array of objects, where each object has `value` and `label` properties.
 * @param {string} props.value - The current selected value.
 * @param {function} props.onValueChange - Callback function when the value changes.
 * @param {string} [props.placeholder="Select option..."] - Placeholder text for the input.
 * @param {string} [props.className=""] - Optional CSS class names for the component.
 * @param {boolean} [props.disabled=false] - If true, the combobox will be disabled.
 */
export function ComboBox({ options, value, onValueChange, placeholder = "Select option...", className = "", disabled = false }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Use label for search, value for actual selection
                  onSelect={(currentLabel) => {
                    // Find the option by its label
                    const selectedOption = options.find(
                      (opt) => opt.label.toLowerCase() === currentLabel.toLowerCase()
                    );
                    onValueChange(selectedOption ? selectedOption.value : "");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}