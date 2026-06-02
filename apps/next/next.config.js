/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native DOM UI — no react-native-web. Only transpile the shared TS packages.
  transpilePackages: ["@summer/client", "@summer/state", "@summer/data", "@summer/domain"],
  // For the Tauri desktop build we export a fully static site (NEXT_EXPORT=1).
  ...(process.env.NEXT_EXPORT ? { output: "export", images: { unoptimized: true } } : {}),
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
