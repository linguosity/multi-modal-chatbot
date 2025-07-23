import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface SplitButtonProps {
  children: React.ReactNode
  onClick: () => void
  dropdownItems: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    separator?: boolean
  }>
  variant?: "default" | "primary" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
}

export function SplitButton({
  children,
  onClick,
  dropdownItems,
  variant = "primary",
  size = "sm",
  disabled = false
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="relative inline-flex">
      {/* Main button */}
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        className="rounded-r-none border-r-0"
      >
        {children}
      </Button>
      
      {/* Dropdown button */}
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="rounded-l-none px-2"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        
        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 z-20 min-w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
              {dropdownItems.map((item, index) => (
                <div key={index}>
                  {item.separator && index > 0 && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  <button
                    onClick={() => {
                      item.onClick()
                      setIsOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}