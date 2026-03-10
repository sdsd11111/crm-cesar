/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // @react-pdf/renderer usa clases internas que no son compatibles con el
  // bundler de Next.js. Le decimos que NO lo empaquete y lo use directo
  // desde node_modules (necesario para que funcione en Vercel).
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig
