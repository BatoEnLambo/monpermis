/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'permisclair.fr' }],
        destination: 'https://www.permisclair.fr/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
