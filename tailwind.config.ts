import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // New pastel-based palette
        primary: {
          DEFAULT: "#F2C2A8", // Pastel Rust (for buttons, accents)
          foreground: "#333333", // Soft Black (for text on primary)
        },
        secondary: {
          DEFAULT: "#F5F0E6", // Pastel Beige (for backgrounds, secondary buttons)
          foreground: "#333333", // Soft Black (for text on secondary)
        },
        destructive: { // Keep as is, for error states
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: { // For subtle text/elements
          DEFAULT: "#E8E2D4", // Lighter beige
          foreground: "#555555", // Medium gray
        },
        accent: { // For subtle highlights
          DEFAULT: "#F2C2A8", // Same as primary light
          foreground: "#333333",
        },
        popover: { // For popovers/cards
          DEFAULT: "#FFFFFF",
          foreground: "#333333",
        },
        card: { // For cards
          DEFAULT: "#FFFFFF",
          foreground: "#333333",
        },
        background: "#F5F0E6", // Overall page background - Pastel Beige
        foreground: "#333333", // Overall text color - Soft Black

        // Original brand colors (can be used for specific, strong accents if needed)
        brand: {
          black: "#000000",
          beige: "#C8BA93",
          rust: "#CD7B56",
        },
        // Simplified gray scale for consistency
        gray: {
          'light': '#F9FAFB', // Very light gray
          'medium': '#E5E7EB', // Light gray
          'dark': '#333333', // Soft black (same as foreground)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", // Custom subtle shadow
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