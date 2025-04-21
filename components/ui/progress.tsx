"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  value: number
}

function Progress({ className, value, ...props }: ProgressProps) {
  const getColor = (value: number) => {
    if (value <= 75) {
      return "bg-green-500"
    } else if (value <= 90) {
      return "bg-yellow-500"
    } else {
      return "bg-red-500"
    }
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full"
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          getColor(value)
        )}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
