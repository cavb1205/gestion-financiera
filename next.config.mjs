/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/reportes/publicidad',
        destination: '/dashboard/publicidad',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
