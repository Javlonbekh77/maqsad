import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';
 
const withNextIntlConfig = withNextIntl(
  // This is the default location of the configuration object
  './src/i18n.ts'
);


const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  }
};

export default withNextIntlConfig(nextConfig);
