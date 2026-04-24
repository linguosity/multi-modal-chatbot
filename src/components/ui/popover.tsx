'use client'

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * Radix's forward-ref component types don't line up with the installed
 * @types/react version (the `ReactPortal` ReactNode variant expects a
 * `children` prop the exotic doesn't surface). We route the primitives
 * through `any`-typed wrappers here so every call site stays cleanly
 * typed. Revisit once the dependency majors line up.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RadixRoot = PopoverPrimitive.Root as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RadixTrigger = PopoverPrimitive.Trigger as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RadixPortal = PopoverPrimitive.Portal as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RadixContent = PopoverPrimitive.Content as any

type PopoverContentProps = {
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  children?: React.ReactNode
}

const Popover = RadixRoot as React.ComponentType<{
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}>

const PopoverTrigger = RadixTrigger as React.ComponentType<{
  children?: React.ReactNode
  asChild?: boolean
}>

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => (
    <RadixPortal>
      <RadixContent
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:data-[state=closed]:slide-out-to-top-[3%] sm:data-[state=open]:slide-in-from-top-[3%]',
          className,
        )}
        {...props}
      >
        {children}
      </RadixContent>
    </RadixPortal>
  ),
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
