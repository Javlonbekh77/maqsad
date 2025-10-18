
import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';
 
const withNextIntlConfig = withNextIntl('./src/i18n.ts');


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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyBhe2N11sLwFEuKzHjDpAYWq1HIywDBYI0",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "maqsadm-206e8.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "maqsadm-206e8",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "maqsadm-206e8.appspot.com",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "313104144997",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:313104144997:web:34bf2eca189bb9879c048c",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-8HXP18G256",
  }
};

export default withNextIntlConfig(nextConfig);
