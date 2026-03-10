/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // transpilePackages compila @react-pdf/renderer para las páginas del 
  // cliente (browser) — resuelve el error "ESM Module not found".
  transpilePackages: ['@react-pdf/renderer'],

  eslint: {
    // Escapa el linting durante el build para ahorrar memoria en Render (Free Tier)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Escapa la validación de tipos durante el build para ahorrar memoria
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Asegurarse de que externals sea un array
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];

      config.externals = [
        ...existingExternals,
        '@react-pdf/renderer',
      ];
    }
    return config;
  },
}

export default nextConfig
