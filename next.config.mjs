/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do not bundle the DB drivers into the server chunks: PGlite ships a WASM
  // runtime and postgres-js resolves native-ish paths — both must load from
  // node_modules at runtime, not from a Webpack bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
