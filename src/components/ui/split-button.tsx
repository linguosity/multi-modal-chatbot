import * as React from "react"
import { ChevronDown, Check, Clock, Save, AlertCircle } from "lucide-react"
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

  // Determine button state and styling. Each state maps to a wf-btn modifier
  // so the split button matches the rest of the wireframe palette.
  const state = (() => {
    if (saveError) {
      return {
        wfClass: 'wf-btn',
        style: { background: '#f4d3cb', borderColor: 'var(--terracotta-ink)', color: 'var(--terracotta-ink)' } as React.CSSProperties,
        icon: <AlertCircle className="h-4 w-4" />,
        pulse: true,
      }
    }
    if (isSaving) {
      return {
        wfClass: cn('wf-btn', variant === 'primary' && 'primary'),
        style: undefined,
        icon: <div className="animate-spin"><Save className="h-4 w-4" /></div>,
        pulse: false,
      }
    }
    if (hasUnsavedChanges) {
      return {
        wfClass: 'wf-btn tan',
        style: undefined,
        icon: <Clock className="h-4 w-4" style={{ color: 'var(--terracotta-ink)' }} />,
        pulse: true,
      }
    }
    if (lastSaved) {
      return {
        wfClass: cn('wf-btn', variant === 'primary' && 'primary'),
        style: undefined,
        icon: <Check className="h-4 w-4" style={{ color: variant === 'primary' ? '#fff' : 'var(--terracotta-ink)' }} />,
        pulse: false,
        title: `Saved ${formatLastSaved(lastSaved)}`,
      }
    }
    return {
      wfClass: cn('wf-btn', variant === 'primary' && 'primary'),
      style: undefined,
      icon: null,
      pulse: false,
    }
  })()

  return (
    <div className="relative inline-flex">
      {/* Main button */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isSaving}
        title={(state as { title?: string }).title}
        className={cn(state.wfClass, state.pulse && 'animate-pulse')}
        style={{
          ...(state.style || {}),
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          boxShadow: 'none',
          paddingRight: 12,
        }}
      >
        {state.icon}
        <span>{children}</span>
      </button>

      {/* Dropdown chevron */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="More actions"
          className={cn(state.wfClass, state.pulse && 'animate-pulse')}
          style={{
            ...(state.style || {}),
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            paddingLeft: 8,
            paddingRight: 8,
            boxShadow: '3px 3px 0 var(--line)',
          }}
        >
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-1 z-20 min-w-52 py-1"
              style={{
                background: 'var(--card-surface)',
                border: '1.5px solid var(--line)',
                borderRadius: 3,
                boxShadow: '4px 4px 0 var(--line)',
              }}
            >
              {dropdownItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.separator && index > 0 && (
                    <div className="my-1" style={{ borderTop: '1px solid var(--line)' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      item.onClick()
                      setIsOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--ink)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
