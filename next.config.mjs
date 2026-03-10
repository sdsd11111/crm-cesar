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
  experimental: {
    // Forzar build en un solo proceso (ayuda con el límite de 512MB en Render)
    webpackBuildWorker: false,
  },
  swcMinify: false, // Desactivar SWC minifier para ahorrar memoria
  webpack: (config, { isServer }) => {
    // Desactivar caché de webpack para ahorrar RAM durante la serialización
    config.cache = false;

    // Desactivar minimización para reducir drásticamente el uso de memoria (Nuclear Option)
    if (config.optimization) {
      config.optimization.minimize = false;
    }

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
