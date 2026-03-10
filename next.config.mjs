/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // transpilePackages es lo que Next.js 14 recomienda hoy para solucionar
  // tanto el error de ESM ("Module not found") como problemas internos 
  // de clases en @react-pdf/renderer.
  transpilePackages: ['@react-pdf/renderer'],
}

export default nextConfig
