// Single source of truth for design tokens, shared by web + native.
// Ported from the original summer-schedule colors.
const tokens = {
  color: {
    bg: "#f6f7f9",
    surface: "#ffffff",
    text: "#1d2127",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    primary: "#2563eb",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#92400e",
    // activity tags
    sport: "#fee2e2",
    work: "#e0e7ff",
    pet: "#f3e8ff",
    moto: "#fde68a",
    culture: "#cffafe",
    other: "#e5e7eb",
    dry: "#dcfce7",
    rain: "#dbeafe",
  },
  radius: { md: 8, lg: 12, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
};

module.exports = tokens;
