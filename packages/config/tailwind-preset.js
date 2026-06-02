// Shared NativeWind/Tailwind preset used by both the Next.js and Expo apps,
// so utility classes mean the same thing on web and native.
const tokens = require("./tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: tokens.color.bg,
        surface: tokens.color.surface,
        ink: tokens.color.text,
        muted: tokens.color.textMuted,
        line: tokens.color.border,
        primary: tokens.color.primary,
        success: tokens.color.success,
        danger: tokens.color.danger,
        tag: {
          sport: tokens.color.sport,
          work: tokens.color.work,
          pet: tokens.color.pet,
          moto: tokens.color.moto,
          culture: tokens.color.culture,
          other: tokens.color.other,
          dry: tokens.color.dry,
          rain: tokens.color.rain,
        },
      },
      borderRadius: {
        md: `${tokens.radius.md}px`,
        lg: `${tokens.radius.lg}px`,
      },
    },
  },
};
