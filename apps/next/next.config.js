/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint isn't configured in this scaffold; type-checking is strict (build fails on type errors).
  eslint: { ignoreDuringBuilds: true },
  // For the Tauri desktop build we export a fully static site (NEXT_EXPORT=1).
  ...(process.env.NEXT_EXPORT ? { output: "export", images: { unoptimized: true } } : {}),
  transpilePackages: [
    "react-native",
    "react-native-web",
    "nativewind",
    "react-native-css-interop",
    "@summer/ui",
    "@summer/app",
    "@summer/state",
    "@summer/data",
    "@summer/domain",
  ],
  webpack: (config) => {
    // Resolve react-native to react-native-web on the web.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
    };
    // Prefer platform-specific .web.* files.
    config.resolve.extensions = [
      ".web.tsx", ".web.ts", ".web.jsx", ".web.js",
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = nextConfig;
