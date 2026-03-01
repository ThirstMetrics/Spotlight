/**
 * Theme definitions for Spotlight and white-label deployments.
 *
 * Each theme provides a complete color palette and logo set so the entire
 * application can be re-skinned per-property or per-partner.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeColors {
  /** Primary brand color (e.g. Spotlight Navy) */
  primary: string;
  /** Primary color used for text on top of primary backgrounds */
  primaryForeground: string;
  /** Accent / highlight color (e.g. Spotlight Green) */
  accent: string;
  /** Accent foreground for text on accent backgrounds */
  accentForeground: string;
  /** Page background */
  background: string;
  /** Default text color */
  foreground: string;
  /** Muted / secondary background */
  muted: string;
  /** Muted text color */
  mutedForeground: string;
  /** Card / panel background */
  card: string;
  /** Card text color */
  cardForeground: string;
  /** Border color */
  border: string;
  /** Sidebar background */
  sidebar: string;
  /** Sidebar text color */
  sidebarForeground: string;
  /** Sidebar active / hover item background */
  sidebarActive: string;
}

export interface ThemeLogo {
  /** Horizontal logo for headers / sidebar expanded state */
  horizontal: string;
  /** Square icon for collapsed sidebar / favicon */
  icon: string;
  /** Path to a favicon file (ICO / SVG / PNG) */
  favicon: string;
}

export interface Theme {
  /** Unique key used to identify this theme */
  name: string;
  /** Human-readable label for display in admin settings */
  label: string;
  /** Light-mode color palette */
  colors: ThemeColors;
  /** Dark-mode color palette (falls back to `colors` when omitted) */
  darkColors?: ThemeColors;
  /** Logo assets */
  logo: ThemeLogo;
}

// ---------------------------------------------------------------------------
// Default Theme — Spotlight
// ---------------------------------------------------------------------------

export const spotlightTheme: Theme = {
  name: "spotlight",
  label: "Spotlight",
  colors: {
    primary: "#06113e",
    primaryForeground: "#ffffff",
    accent: "#5ad196",
    accentForeground: "#06113e",
    background: "#f8f9fc",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    card: "#ffffff",
    cardForeground: "#0f172a",
    border: "#e2e8f0",
    sidebar: "#06113e",
    sidebarForeground: "#ffffff",
    sidebarActive: "rgba(90, 209, 150, 0.15)",
  },
  darkColors: {
    primary: "#5ad196",
    primaryForeground: "#06113e",
    accent: "#5ad196",
    accentForeground: "#06113e",
    background: "#020617",
    foreground: "#f8fafc",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    card: "#0f172a",
    cardForeground: "#f8fafc",
    border: "#1e293b",
    sidebar: "#020617",
    sidebarForeground: "#f8fafc",
    sidebarActive: "rgba(90, 209, 150, 0.15)",
  },
  logo: {
    horizontal: "/logos/spotlight-horizontal-white.svg",
    icon: "/logos/spotlight-icon-white.svg",
    favicon: "/logos/spotlight-icon-navy.svg",
  },
};

// ---------------------------------------------------------------------------
// Example White-Label — "Grand Luxe Hotels"
// ---------------------------------------------------------------------------

export const grandLuxeTheme: Theme = {
  name: "grand-luxe",
  label: "Grand Luxe Hotels",
  colors: {
    primary: "#7c2d12",
    primaryForeground: "#ffffff",
    accent: "#d97706",
    accentForeground: "#ffffff",
    background: "#fefce8",
    foreground: "#1c1917",
    muted: "#f5f5f4",
    mutedForeground: "#78716c",
    card: "#ffffff",
    cardForeground: "#1c1917",
    border: "#e7e5e4",
    sidebar: "#7c2d12",
    sidebarForeground: "#ffffff",
    sidebarActive: "rgba(217, 119, 6, 0.15)",
  },
  logo: {
    horizontal: "/logos/spotlight-horizontal-white.svg",
    icon: "/logos/spotlight-icon-white.svg",
    favicon: "/logos/spotlight-icon-navy.svg",
  },
};

// ---------------------------------------------------------------------------
// Example White-Label — "Pacific Resorts"
// ---------------------------------------------------------------------------

export const pacificResortsTheme: Theme = {
  name: "pacific-resorts",
  label: "Pacific Resorts",
  colors: {
    primary: "#0c4a6e",
    primaryForeground: "#ffffff",
    accent: "#06b6d4",
    accentForeground: "#ffffff",
    background: "#f0f9ff",
    foreground: "#0f172a",
    muted: "#e0f2fe",
    mutedForeground: "#475569",
    card: "#ffffff",
    cardForeground: "#0f172a",
    border: "#bae6fd",
    sidebar: "#0c4a6e",
    sidebarForeground: "#ffffff",
    sidebarActive: "rgba(6, 182, 212, 0.15)",
  },
  logo: {
    horizontal: "/logos/spotlight-horizontal-white.svg",
    icon: "/logos/spotlight-icon-white.svg",
    favicon: "/logos/spotlight-icon-navy.svg",
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All available themes keyed by their `name` value. */
export const themes: Record<string, Theme> = {
  spotlight: spotlightTheme,
  "grand-luxe": grandLuxeTheme,
  "pacific-resorts": pacificResortsTheme,
};
