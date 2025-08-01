import * as React from "react"
import { ChevronDown, Check, Clock, Save, AlertCircle } from "lucide-react"
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
  // Save status props
  isSaving?: boolean
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
  saveError?: Error | null
}

export function SplitButton({
  children,
  onClick,
  dropdownItems,
  variant = "primary",
  size = "sm",
  disabled = false,
  isSaving = false,
  lastSaved = null,
  hasUnsavedChanges = false,
  saveError = null
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes === 1) return '1 minute ago'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    
    return date.toLocaleDateString()
  }

  // Determine button state and styling
  const getButtonState = () => {
    if (saveError) {
      return {
        variant: "destructive" as const,
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Save Failed",
        pulse: true
      }
    }
    
    if (isSaving) {
      return {
        variant: variant,
        icon: <div className="animate-spin"><Save className="h-4 w-4" /></div>,
        text: "Saving...",
        pulse: false
      }
    }
    
    if (hasUnsavedChanges) {
      return {
        variant: "secondary" as const,
        icon: <Clock className="h-4 w-4 text-orange-500" />,
        text: "Unsaved",
        pulse: true
      }
    }
    
    if (lastSaved) {
      return {
        variant: variant,
        icon: <Check className="h-4 w-4 text-green-500" />,
        text: `Saved ${formatLastSaved(lastSaved)}`,
        pulse: false
      }
    }
    
    return {
      variant: variant,
      icon: null,
      text: null,
      pulse: false
    }
  }

  const buttonState = getButtonState()

  return (
    <div className="relative inline-flex flex-col">
      <div className="flex">
        {/* Main button */}
        <Button
          variant={buttonState.variant}
          size={size}
          onClick={onClick}
          disabled={disabled || isSaving}
          className={cn(
            "rounded-r-none border-r-0 relative",
            buttonState.pulse && "animate-pulse"
          )}
        >
          <div className="flex items-center gap-1">
            {buttonState.icon}
            {children}
          </div>
        </Button>
        
        {/* Dropdown button */}
        <div className="relative">
          <Button
            variant={buttonState.variant}
            size={size}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "rounded-l-none px-2",
              buttonState.pulse && "animate-pulse"
            )}
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
      

    </div>
  )
}