/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/actualizar-app', headers: [{ key: 'X-Robots-Tag', value: 'noindex, noarchive' }] }];
  },
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
