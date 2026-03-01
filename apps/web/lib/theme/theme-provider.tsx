"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Theme, ThemeColors } from "./themes";
import { spotlightTheme } from "./themes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ColorMode = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The currently active theme definition */
  theme: Theme;
  /** Active color mode */
  colorMode: ColorMode;
  /** The resolved palette (accounts for dark mode) */
  resolvedColors: ThemeColors;
  /** Whether the resolved palette is the dark variant */
  isDark: boolean;
  /** Programmatically switch color mode */
  setColorMode: (mode: ColorMode) => void;
  /** Programmatically override the theme at runtime */
  setTheme: (theme: Theme) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// CSS variable helper
// ---------------------------------------------------------------------------

function hexToHSL(hex: string): string {
  // Handle rgba(...) passthrough (used for sidebarActive and similar)
  if (hex.startsWith("rgba") || hex.startsWith("rgb") || hex.startsWith("hsl")) {
    return hex;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Apply a ThemeColors palette as CSS custom properties on the document root.
 *
 * We write both the raw hex values (--color-primary) and shadcn-compatible HSL
 * values (--primary) so Tailwind utilities and shadcn/ui work seamlessly.
 */
function applyColorsToRoot(colors: ThemeColors) {
  const root = document.documentElement;

  // Raw hex / value custom properties for direct use
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-primary-foreground", colors.primaryForeground);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-accent-foreground", colors.accentForeground);
  root.style.setProperty("--color-background", colors.background);
  root.style.setProperty("--color-foreground", colors.foreground);
  root.style.setProperty("--color-muted", colors.muted);
  root.style.setProperty("--color-muted-foreground", colors.mutedForeground);
  root.style.setProperty("--color-card", colors.card);
  root.style.setProperty("--color-card-foreground", colors.cardForeground);
  root.style.setProperty("--color-border", colors.border);
  root.style.setProperty("--color-sidebar", colors.sidebar);
  root.style.setProperty("--color-sidebar-foreground", colors.sidebarForeground);
  root.style.setProperty("--color-sidebar-active", colors.sidebarActive);

  // shadcn/ui-compatible HSL custom properties (used by Tailwind config)
  root.style.setProperty("--primary", hexToHSL(colors.primary));
  root.style.setProperty("--primary-foreground", hexToHSL(colors.primaryForeground));
  root.style.setProperty("--accent", hexToHSL(colors.accent));
  root.style.setProperty("--accent-foreground", hexToHSL(colors.accentForeground));
  root.style.setProperty("--background", hexToHSL(colors.background));
  root.style.setProperty("--foreground", hexToHSL(colors.foreground));
  root.style.setProperty("--muted", hexToHSL(colors.muted));
  root.style.setProperty("--muted-foreground", hexToHSL(colors.mutedForeground));
  root.style.setProperty("--card", hexToHSL(colors.card));
  root.style.setProperty("--card-foreground", hexToHSL(colors.cardForeground));
  root.style.setProperty("--border", hexToHSL(colors.border));
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Provide a custom theme to override the default Spotlight theme. */
  theme?: Theme;
  /** Initial color mode. Defaults to "light". */
  defaultColorMode?: ColorMode;
}

export function ThemeProvider({
  children,
  theme: themeProp,
  defaultColorMode = "light",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(themeProp ?? spotlightTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(defaultColorMode);
  const [systemDark, setSystemDark] = useState(false);

  // Detect system preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mql.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const isDark = colorMode === "dark" || (colorMode === "system" && systemDark);

  const resolvedColors = useMemo<ThemeColors>(() => {
    if (isDark && theme.darkColors) return theme.darkColors;
    return theme.colors;
  }, [isDark, theme]);

  // Apply CSS variables whenever resolved colors change
  useEffect(() => {
    if (typeof document === "undefined") return;
    applyColorsToRoot(resolvedColors);

    // Toggle the `dark` class for Tailwind darkMode: "class"
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedColors, isDark]);

  // Keep favicon in sync with theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = theme.logo.favicon;
  }, [theme.logo.favicon]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("spotlight-color-mode", mode);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Restore persisted color mode on mount
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const stored = localStorage.getItem("spotlight-color-mode") as ColorMode | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setColorModeState(stored);
    }
  }, []);

  // Sync if parent changes the theme prop
  useEffect(() => {
    if (themeProp) setThemeState(themeProp);
  }, [themeProp]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colorMode,
      resolvedColors,
      isDark,
      setColorMode,
      setTheme,
    }),
    [theme, colorMode, resolvedColors, isDark, setColorMode, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme context. Must be used inside a <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}
