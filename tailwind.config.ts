import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"
import { tokens } from "./src/lib/design-tokens"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Shadcn/ui system colors (preserved for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Design token colors - Professional clinical palette
        ...tokens.colors,
        
        // Shadcn/ui semantic colors (updated to use design tokens)
        primary: {
          DEFAULT: tokens.colors.primary[600],
          foreground: "#ffffff",
          ...tokens.colors.primary,
        },
        secondary: {
          DEFAULT: tokens.colors.secondary[100],
          foreground: tokens.colors.secondary[900],
          ...tokens.colors.secondary,
        },
        destructive: {
          DEFAULT: tokens.colors.semantic.error,
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: tokens.colors.gray[100],
          foreground: tokens.colors.gray[600],
        },
        accent: {
          DEFAULT: tokens.colors.primary[100],
          foreground: tokens.colors.primary[900],
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: tokens.colors.gray[900],
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: tokens.colors.gray[900],
        },

        // Legacy brand colors (preserved for backward compatibility)
        brand: {
          black: "#000000",
          beige: "#C8BA93", 
          rust: "#CD7B56",
        },
      },
      borderRadius: {
        // Design token border radius values
        ...tokens.borderRadius,
        // Shadcn/ui compatibility (preserved)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Design token spacing values
        ...tokens.spacing,
      },
      fontSize: {
        // Design token typography sizes
        ...tokens.typography.sizes,
      },
      boxShadow: {
        // Design token shadow values
        ...tokens.shadows,
        // Additional shadows for specific use cases
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), require("@tailwindcss/forms")],
} satisfies Config

export default config