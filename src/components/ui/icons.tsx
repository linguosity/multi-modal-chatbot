'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// --- Existing Icons (keep them) ---

function IconSeparator({ className, ...props }: React.ComponentProps<'svg'>) {
  // ... (separator svg code remains the same) ...
    return (
        <svg
        fill="none"
        shapeRendering="geometricPrecision"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn('size-4', className)}
        {...props}
        >
        <path d="M16.88 3.549L7.12 20.451"></path>
        </svg>
    )
}


function IconNextChat({
  className,
  inverted,
  ...props
}: React.ComponentProps<'svg'> & { inverted?: boolean }) {
  // ... (nextchat svg code remains the same) ...
    const id = React.useId()
    return (
        <svg
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('size-4', className)}
        {...props}
        >
        {/* ... defs and paths ... */}
        <defs>
            <linearGradient
            id={`gradient-${id}-1`}
            x1="10.6889"
            y1="10.3556"
            x2="13.8445"
            y2="14.2667"
            gradientUnits="userSpaceOnUse"
            >
            <stop stopColor={inverted ? 'white' : 'black'} />
            <stop
                offset={1}
                stopColor={inverted ? 'white' : 'black'}
                stopOpacity={0}
            />
            </linearGradient>
            <linearGradient
            id={`gradient-${id}-2`}
            x1="11.7555"
            y1="4.8"
            x2="11.7376"
            y2="9.50002"
            gradientUnits="userSpaceOnUse"
            >
            <stop stopColor={inverted ? 'white' : 'black'} />
            <stop
                offset={1}
                stopColor={inverted ? 'white' : 'black'}
                stopOpacity={0}
            />
            </linearGradient>
        </defs>
        <path
            d="M1 16L2.58314 11.2506C1.83084 9.74642 1.63835 8.02363 2.04013 6.39052C2.4419 4.75741 3.41171 3.32057 4.776 2.33712C6.1403 1.35367 7.81003 0.887808 9.4864 1.02289C11.1628 1.15798 12.7364 1.8852 13.9256 3.07442C15.1148 4.26363 15.842 5.83723 15.9771 7.5136C16.1122 9.18997 15.6463 10.8597 14.6629 12.224C13.6794 13.5883 12.2426 14.5581 10.6095 14.9599C8.97637 15.3616 7.25358 15.1692 5.74942 14.4169L1 16Z"
            fill={inverted ? 'black' : 'white'}
            stroke={inverted ? 'black' : 'white'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <mask
            id="mask0_91_2047"
            style={{ maskType: 'alpha' }}
            maskUnits="userSpaceOnUse"
            x={1}
            y={0}
            width={16}
            height={16}
        >
            <circle cx={9} cy={8} r={8} fill={inverted ? 'black' : 'white'} />
        </mask>
        <g mask="url(#mask0_91_2047)">
            <circle cx={9} cy={8} r={8} fill={inverted ? 'black' : 'white'} />
            <path
            d="M14.2896 14.0018L7.146 4.8H5.80005V11.1973H6.87681V6.16743L13.4444 14.6529C13.7407 14.4545 14.0231 14.2369 14.2896 14.0018Z"
            fill={`url(#gradient-${id}-1)`}
            />
            <rect
            x="11.2222"
            y="4.8"
            width="1.06667"
            height="6.4"
            fill={`url(#gradient-${id}-2)`}
            />
        </g>
        </svg>
    )
}

function IconVercel({ className, ...props }: React.ComponentProps<'svg'>) {
  // ... (vercel svg code remains the same) ...
    return (
        <svg
        aria-label="Vercel logomark"
        role="img"
        viewBox="0 0 74 64"
        className={cn('size-4', className)}
        {...props}
        >
        <path
            d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
            fill="currentColor"
        ></path>
        </svg>
    )
}

function IconArrowUp({ className, ...props }: React.ComponentProps<'svg'>) {
  // ... (arrow up svg code remains the same) ...
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        fill="currentColor"
        // Removed stroke="currentColor" and strokeWidth if fill is used primarily
        className={cn('size-4', className)}
        {...props}
        >
        <path d="M122.34 34.34l72 72a8 8 0 0 1-11.32 11.32L136 59.31V216a8 8 0 0 1-16 0V59.31L73.66 117.66a8 8 0 0 1-11.32-11.32l72-72a8 8 0 0 1 11.32 0Z" />
        </svg>
    )
}

// --- NEW: Add IconSpinner ---
function IconSpinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)} // Added animate-spin directly here
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// --- NEW: Add IconGoogle ---
// (Example using a simple path - replace with a proper Google SVG if needed)
function IconGoogle({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn('size-4', className)}
      {...props}
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.8 1.98-5.6 1.98-5.6 0-9.9-4.33-9.9-9.9s4.3-9.9 9.9-9.9c2.38 0 4.95.99 6.7 2.6l2.7-2.7C19.4 1.74 16.4.84 12.48.84c-6.6 0-12 5.4-12 12s5.4 12 12 12c6.9 0 11.7-4.73 11.7-11.9 0-.73-.12-1.42-.24-2.04h-11.2z" />
    </svg>
  );
}


// --- UPDATED EXPORT ---
// Export a single object containing all icons with lowercase keys
export const Icons = {
  separator: IconSeparator,
  nextChat: IconNextChat,
  vercel: IconVercel,
  arrowUp: IconArrowUp,
  spinner: IconSpinner, // Added spinner
  google: IconGoogle,   // Added google
};

// Remove the old individual export:
// export {
//   IconSeparator,
//   IconNextChat,
//   IconVercel,
//   IconArrowUp
// }
// ;