import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        spotlight: {
          navy: {
            DEFAULT: "#06113e",
            50: "#f0f1f8",
            100: "#d4d7e8",
            200: "#a9afd1",
            300: "#7e87ba",
            400: "#535fa3",
            500: "#28378c",
            600: "#1e2a6b",
            700: "#141d4a",
            800: "#0a1029",
            900: "#06113e",
            950: "#030820",
          },
          green: {
            DEFAULT: "#5ad196",
            50: "#f0fbf5",
            100: "#d4f3e3",
            200: "#a9e7c7",
            300: "#7edbab",
            400: "#5ad196",
            500: "#3dbf7d",
            600: "#2e9961",
            700: "#1f7345",
            800: "#104d29",
            900: "#08271a",
            950: "#04130d",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
