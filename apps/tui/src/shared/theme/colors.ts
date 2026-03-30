/**
 * Keryx Theme Colors
 * Consistent color palette across the application
 */

export const COLORS = {
  // Primary branding
  primary: "cyan",
  primaryDim: "#4A9BA8",
  accent: "#4052D6",

  // Text
  text: "white",
  textMuted: "gray",
  textDim: "dim",

  // Status indicators
  success: "green",
  successDim: "#2D5A2D",
  warning: "yellow",
  warningDim: "#8B8B00",
  error: "red",
  errorDim: "#8B0000",

  // UI elements
  border: "gray",
  borderFocus: "cyan",
  borderDim: "#444444",

  // Interactive elements
  button: "#4052D6",
  buttonHover: "#5A6AE6",
  highlight: "cyan",
  selection: "#1E3A5F",

  // Panel backgrounds (for future use)
  panelBg: "#1A1A2E",
  headerBg: "#16213E",
} as const;

/**
 * Status-specific color configurations
 */
export const STATUS_COLORS = {
  online: {
    dot: "●",
    color: "green",
    label: "Online",
  },
  slow: {
    dot: "◐",
    color: "yellow",
    label: "Slow",
  },
  offline: {
    dot: "○",
    color: "red",
    label: "Offline",
  },
  connecting: {
    dot: "◌",
    color: "cyan",
    label: "Connecting",
  },
} as const;

/**
 * Tree view icons
 */
export const TREE_ICONS = {
  database: "",
  schema: "",
  table: "",
  tableSelected: "►",
  expanded: "▼",
  collapsed: "▶",
  line: "│",
  branch: "├─",
  lastBranch: "└─",
  space: "  ",
} as const;

export type ColorName = keyof typeof COLORS;
export type StatusType = keyof typeof STATUS_COLORS;
