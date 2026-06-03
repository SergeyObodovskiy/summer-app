/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native DOM UI — no react-native-web. Only transpile the shared TS packages.
  transpilePackages: ["@summer/client", "@summer/state", "@summer/data", "@summer/domain"],
  // For the Tauri desktop build we export a fully static site (NEXT_EXPORT=1).
  ...(process.env.NEXT_EXPORT ? { output: "export", images: { unoptimized: true } } : {}),
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { dev }) => {
    // The project lives in an iCloud-synced folder (~/Documents); iCloud interferes
    // with webpack's filesystem-cache rename → harmless ENOENT warnings. Use the
    // in-memory cache in dev to avoid them.
    if (dev) config.cache = { type: "memory" };
    return config;
  },
};

module.exports = nextConfig;
