/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // <-- Esta línea es crucial para Docker
  images: {
    domains: ['localhost', 'placehold.co'],
  },
}
module.exports = nextConfig