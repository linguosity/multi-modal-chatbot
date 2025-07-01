import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative block bg-white border border-charcoal shadow-sm",
      className
    )}
    {...props}
  >
    <span className="absolute inset-0 border border-dashed border-charcoal"></span>
    <div className="relative flex h-full transform items-start border-2 border-black bg-white transition-transform group-hover:-translate-x-2 group-hover:-translate-y-2">
      {children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 sm:p-6 lg:p-8", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "mt-2 text-base font-medium sm:text-lg",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-4 text-sm sm:text-base", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 lg:p-8 max-h-32 overflow-y-auto break-words", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-8 font-bold", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

const SectionHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center mb-4", className)} {...props}>
        <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
        <span className="shrink-0 px-4 text-gray-900 dark:text-white">{children}</span>
        <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
    </div>
))
SectionHeader.displayName = "SectionHeader"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, SectionHeader }