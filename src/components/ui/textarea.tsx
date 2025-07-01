import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn(
        "relative mt-0.5 overflow-hidden rounded border border-gray-300 shadow-sm focus-within:ring focus-within:ring-blue-600 dark:border-gray-600",
        className
      )}
    >
      <textarea
        className="w-full resize-none border-none align-top focus:ring-0 sm:text-sm dark:bg-gray-900 dark:text-white"
        rows={4} // Default rows, can be overridden by props
        ref={ref}
        {...props}
      ></textarea>
    </div>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }