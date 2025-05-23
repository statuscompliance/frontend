import * as React from "react"
import { Slot as SlotPrimitive } from "radix-ui"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-sidebar-accent border-2 text-white",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      positioning: {
        default: "justify-center",
        start: "justify-start",
        end: "justify-end",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      positioning: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, positioning, asChild = false, userRole, ...props }, ref) => {
  if (userRole === 'USER') {
    return null;
  }
  
  const Comp = asChild ? SlotPrimitive.Root : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, positioning, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
