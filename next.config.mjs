/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // transpilePackages compila @react-pdf/renderer para las páginas del 
  // cliente (browser) — resuelve el error "ESM Module not found".
  transpilePackages: ['@react-pdf/renderer'],

  /**
   * Override de Webpack para resolver el error "CC.Component is not a constructor"
   * en las API Routes del servidor en Vercel.
   * 
   * Problema: cuando Webpack bundlea las API routes para el servidor, aplana
   * las clases internas de @react-pdf/renderer y las rompe.
   * 
   * Solución: marcar el paquete como "external" SOLO para el servidor.
   * Esto le dice a Vercel: "no incluyas @react-pdf/renderer en el bundle 
   * de la API route; cárgalo directamente desde node_modules en runtime".
   * 
   * - Para el CLIENTE: transpilePackages (arriba) sigue manejándolo. ✅
   * - Para el SERVIDOR: webpack external lo excluye del bundle. ✅
   * - No hay conflicto porque actúan en etapas/builds distintos.
   */
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
